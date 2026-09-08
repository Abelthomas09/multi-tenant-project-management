const { RoleName } = require("@prisma/client");
const { prisma } = require("../lib/prisma");
const { HttpError } = require("../utils/httpError");

async function getAdminPermissionData() {
  const [adminRole, permissions] = await Promise.all([
    prisma.role.findUnique({
      where: { name: RoleName.ADMIN },
      include: { rolePermissions: { include: { permission: true } } },
    }),
    prisma.permission.findMany({ orderBy: { code: "asc" } }),
  ]);
  if (!adminRole) throw new HttpError(500, "Admin role configuration is missing.");

  const assignedPermissionCodes = adminRole.rolePermissions.map(({ permission }) => permission.code);
  return {
    role: { id: adminRole.id, name: adminRole.name },
    permissions: permissions.map(({ code, description }) => ({ code, description })),
    assignedPermissionCodes,
  };
}

async function updateAdminPermissions(permissionCodes) {
  if (!Array.isArray(permissionCodes) || permissionCodes.some((code) => typeof code !== "string")) {
    throw new HttpError(400, "permissionCodes must be an array of permission codes.");
  }
  const uniqueCodes = [...new Set(permissionCodes)];
  const permissions = await prisma.permission.findMany({
    where: { code: { in: uniqueCodes } },
    select: { id: true, code: true },
  });
  if (permissions.length !== uniqueCodes.length) {
    const knownCodes = new Set(permissions.map(({ code }) => code));
    const invalidCodes = uniqueCodes.filter((code) => !knownCodes.has(code));
    throw new HttpError(
      400,
      "One or more permission codes are invalid.",
      invalidCodes.map((code) => ({ field: "permissionCodes", message: `Unknown permission: ${code}` }))
    );
  }

  const adminRole = await prisma.role.findUnique({ where: { name: RoleName.ADMIN }, select: { id: true } });
  if (!adminRole) throw new HttpError(500, "Admin role configuration is missing.");

  await prisma.$transaction(async (transaction) => {
    await transaction.rolePermission.deleteMany({ where: { roleId: adminRole.id } });
    if (permissions.length > 0) {
      await transaction.rolePermission.createMany({
        data: permissions.map((permission) => ({ roleId: adminRole.id, permissionId: permission.id })),
      });
    }
  });

  return getAdminPermissionData();
}

module.exports = {
  getAdminPermissionData,
  updateAdminPermissions,
};
