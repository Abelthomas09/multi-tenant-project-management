const { ProjectStatus } = require("@prisma/client");
const { prisma } = require("../lib/prisma");
const { tenantWhere } = require("../middleware/tenantIsolation");
const { HttpError } = require("../utils/httpError");
const { validateUUID, getPagination } = require("../utils/validation");

const validStatuses = Object.values(ProjectStatus);

const projectSelect = {
  id: true,
  name: true,
  address: true,
  useCase: true,
  status: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
};

function validateProjectPayload(body, { requireAllFields }) {
  const errors = [];
  const data = {};
  const textFields = ["name", "address", "useCase"];

  if (Object.hasOwn(body, "tenantId")) {
    errors.push({ field: "tenantId", message: "tenantId is determined by the authenticated tenant." });
  }

  for (const field of textFields) {
    if (!Object.hasOwn(body, field)) {
      if (requireAllFields) errors.push({ field, message: `${field} is required.` });
      continue;
    }

    if (typeof body[field] !== "string" || !body[field].trim()) {
      errors.push({ field, message: `${field} must be a non-empty string.` });
    } else {
      data[field] = body[field].trim();
    }
  }

  if (!Object.hasOwn(body, "status")) {
    if (requireAllFields) errors.push({ field: "status", message: "status is required." });
  } else if (!validStatuses.includes(body.status)) {
    errors.push({ field: "status", message: `status must be one of: ${validStatuses.join(", ")}.` });
  } else {
    data.status = body.status;
  }

  if (!requireAllFields && Object.keys(data).length === 0 && errors.length === 0) {
    errors.push({ field: "body", message: "Provide at least one project field to update." });
  }
  if (errors.length > 0) throw new HttpError(400, "Validation failed.", errors);

  return data;
}

async function getProjects(req, query) {
  const { page, pageSize } = getPagination(query);
  const filters = {};
  if (query.status) {
    if (!validStatuses.includes(query.status)) {
      throw new HttpError(400, `status must be one of: ${validStatuses.join(", ")}.`);
    }
    filters.status = query.status;
  }

  const where = tenantWhere(req, filters);
  const [projects, total] = await prisma.$transaction([
    prisma.project.findMany({
      where,
      select: projectSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.project.count({ where }),
  ]);

  return {
    projects,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

async function createProject(req, body) {
  const data = validateProjectPayload(body || {}, { requireAllFields: true });
  return prisma.project.create({
    data: { ...data, tenantId: req.tenant.id },
    select: projectSelect,
  });
}

async function getProjectById(req, rawId) {
  const id = validateUUID(rawId, "Project ID");
  const project = await prisma.project.findFirst({
    where: tenantWhere(req, { id }),
    select: projectSelect,
  });
  if (!project) throw new HttpError(404, "Project not found.");
  return project;
}

async function updateProject(req, rawId, body) {
  const id = validateUUID(rawId, "Project ID");
  const data = validateProjectPayload(body || {}, { requireAllFields: false });
  const existingProject = await prisma.project.findFirst({ where: tenantWhere(req, { id }), select: { id: true } });
  if (!existingProject) throw new HttpError(404, "Project not found.");

  return prisma.project.update({ where: { id }, data, select: projectSelect });
}

async function deleteProject(req, rawId) {
  const id = validateUUID(rawId, "Project ID");
  const existingProject = await prisma.project.findFirst({ where: tenantWhere(req, { id }), select: { id: true } });
  if (!existingProject) throw new HttpError(404, "Project not found.");

  await prisma.project.delete({ where: { id } });
  return null;
}

module.exports = {
  validStatuses,
  projectSelect,
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
};
