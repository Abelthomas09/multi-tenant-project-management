const bcrypt = require("bcryptjs");
const { RoleName } = require("@prisma/client");
const { prisma } = require("../lib/prisma");
const { tenantWhere } = require("../middleware/tenantIsolation");
const { HttpError } = require("../utils/httpError");
const { validateUUID, getPagination, emailPattern } = require("../utils/validation");

const manageableRoles = [RoleName.ADMIN, RoleName.AGENT];
const agentPermissionCodes = ["projects.create", "projects.update", "projects.delete"];
const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  isActive: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { name: true } },
};

function serializeUser(user) {
  return { ...user, role: user.role.name };
}

function assertAssignableRole(req, roleName) {
  if (!manageableRoles.includes(roleName)) throw new HttpError(400, "role must be ADMIN or AGENT for tenant-scoped user management.");
  if (req.auth.role !== RoleName.SUPER_ADMIN && roleName !== RoleName.AGENT) {
    throw new HttpError(403, "Only Super Admins can manage Admin users.");
  }
}

function validateCreatePayload(req) {
  const body = req.body || {};
  const errors = [];
  const data = {};
  for (const field of ["firstName", "lastName"]) {
    if (typeof body[field] !== "string" || !body[field].trim()) errors.push({ field, message: `${field} must be a non-empty string.` });
    else data[field] = body[field].trim();
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!emailPattern.test(email)) errors.push({ field: "email", message: "email must be valid." });
  else data.email = email;
  if (typeof body.password !== "string" || body.password.length < 8) errors.push({ field: "password", message: "password must be at least 8 characters long." });
  else data.password = body.password;
  try {
    assertAssignableRole(req, body.role);
    data.role = body.role;
  } catch (error) {
    if (!(error instanceof HttpError)) throw error;
    if (error.statusCode === 403) throw error;
    errors.push({ field: "role", message: error.message });
  }
  if (Object.hasOwn(body, "tenantId")) errors.push({ field: "tenantId", message: "tenantId is determined by the authenticated tenant." });
  if (errors.length > 0) throw new HttpError(400, "Validation failed.", errors);
  return data;
}

function validateUpdatePayload(req) {
  const body = req.body || {};
  const errors = [];
  const data = {};
  for (const field of ["firstName", "lastName"]) {
    if (!Object.hasOwn(body, field)) continue;
    if (typeof body[field] !== "string" || !body[field].trim()) errors.push({ field, message: `${field} must be a non-empty string.` });
    else data[field] = body[field].trim();
  }
  if (Object.hasOwn(body, "email")) {
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!emailPattern.test(email)) errors.push({ field: "email", message: "email must be valid." });
    else data.email = email;
  }
  if (Object.hasOwn(body, "role")) {
    try {
      assertAssignableRole(req, body.role);
      data.role = body.role;
    } catch (error) {
      if (!(error instanceof HttpError)) throw error;
      if (error.statusCode === 403) throw error;
      errors.push({ field: "role", message: error.message });
    }
  }
  for (const field of ["tenantId", "password", "isActive"]) {
    if (Object.hasOwn(body, field)) errors.push({ field, message: `${field} cannot be updated through this endpoint.` });
  }
  if (Object.keys(data).length === 0 && errors.length === 0) errors.push({ field: "body", message: "Provide at least one user field to update." });
  if (errors.length > 0) throw new HttpError(400, "Validation failed.", errors);
  return data;
}

async function findManageableUser(req, id) {
  const user = await prisma.user.findFirst({ where: tenantWhere(req, { id }), select: userSelect });
  if (!user || user.role.name === RoleName.SUPER_ADMIN) throw new HttpError(404, "User not found.");
  if (req.auth.role !== RoleName.SUPER_ADMIN && user.role.name !== RoleName.AGENT) throw new HttpError(404, "User not found.");
  return user;
}

async function getRoleId(roleName) {
  const role = await prisma.role.findUnique({ where: { name: roleName }, select: { id: true } });
  if (!role) throw new HttpError(500, "Required role configuration is missing.");
  return role.id;
}

async function findAgentForPermissionManagement(req, id) {
  const user = await prisma.user.findFirst({
    where: tenantWhere(req, { id, role: { name: RoleName.AGENT } }),
    select: { id: true, firstName: true, lastName: true, email: true },
  });
  if (!user) throw new HttpError(404, "Agent not found.");
  return user;
}

async function getUsers(req, query) {
  const { page, pageSize } = getPagination(query);
  const filters = {};
  if (query.role) {
    if (!manageableRoles.includes(query.role)) throw new HttpError(400, "role must be ADMIN or AGENT.");
    filters.role = { name: query.role };
  }
  if (query.isActive !== undefined) {
    if (query.isActive !== "true" && query.isActive !== "false") throw new HttpError(400, "isActive must be true or false.");
    filters.isActive = query.isActive === "true";
  }
  if (req.auth.role !== RoleName.SUPER_ADMIN) filters.role = { name: RoleName.AGENT };
  const where = tenantWhere(req, filters);
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map(serializeUser),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

async function createUser(req) {
  const data = validateCreatePayload(req);
  const passwordHash = await bcrypt.hash(data.password, 12);
  const roleId = await getRoleId(data.role);
  const user = await prisma.user.create({
    data: { firstName: data.firstName, lastName: data.lastName, email: data.email, passwordHash, roleId, tenantId: req.tenant.id },
    select: userSelect,
  });
  return serializeUser(user);
}

async function getAgentPermissions(req, rawId) {
  const id = validateUUID(rawId, "User ID");
  const user = await findAgentForPermissionManagement(req, id);
  const assigned = await prisma.userPermission.findMany({
    where: { userId: id, permission: { code: { in: agentPermissionCodes } } },
    select: { permission: { select: { code: true } } },
  });
  const permissions = await prisma.permission.findMany({
    where: { code: { in: agentPermissionCodes } },
    select: { code: true, description: true },
    orderBy: { code: "asc" },
  });

  return {
    user,
    permissions,
    assignedPermissionCodes: assigned.map(({ permission }) => permission.code),
  };
}

async function updateAgentPermissions(req, rawId, permissionCodes) {
  const id = validateUUID(rawId, "User ID");
  await findAgentForPermissionManagement(req, id);

  if (!Array.isArray(permissionCodes) || permissionCodes.some((code) => typeof code !== "string")) {
    throw new HttpError(400, "permissionCodes must be an array of permission codes.");
  }
  const uniqueCodes = [...new Set(permissionCodes)];
  const invalidCodes = uniqueCodes.filter((code) => !agentPermissionCodes.includes(code));
  if (invalidCodes.length > 0) {
    throw new HttpError(
      400,
      "Agents can only be granted project create, update, or delete permissions.",
      invalidCodes.map((code) => ({ field: "permissionCodes", message: `Invalid Agent permission: ${code}` }))
    );
  }
  const permissions = await prisma.permission.findMany({
    where: { code: { in: uniqueCodes } },
    select: { id: true },
  });
  if (permissions.length !== uniqueCodes.length) throw new HttpError(500, "Required permission configuration is missing.");

  await prisma.$transaction(async (transaction) => {
    await transaction.userPermission.deleteMany({ where: { userId: id, permission: { code: { in: agentPermissionCodes } } } });
    if (permissions.length > 0) {
      await transaction.userPermission.createMany({ data: permissions.map((permission) => ({ userId: id, permissionId: permission.id })) });
    }
  });

  return { assignedPermissionCodes: uniqueCodes };
}

async function updateUser(req, rawId) {
  const id = validateUUID(rawId, "User ID");
  const data = validateUpdatePayload(req);
  await findManageableUser(req, id);
  if (data.role) {
    data.roleId = await getRoleId(data.role);
    delete data.role;
  }
  const user = await prisma.user.update({ where: { id }, data, select: userSelect });
  return serializeUser(user);
}

async function updateUserStatus(req, rawId, isActive) {
  const id = validateUUID(rawId, "User ID");
  if (typeof isActive !== "boolean") {
    throw new HttpError(400, "isActive must be a boolean.", [{ field: "isActive", message: "isActive must be a boolean." }]);
  }
  await findManageableUser(req, id);
  const user = await prisma.user.update({ where: { id }, data: { isActive }, select: userSelect });
  return serializeUser(user);
}

module.exports = {
  serializeUser,
  manageableRoles,
  agentPermissionCodes,
  getUsers,
  createUser,
  getAgentPermissions,
  updateAgentPermissions,
  updateUser,
  updateUserStatus,
};
