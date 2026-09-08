const { prisma } = require("../lib/prisma");
const { HttpError } = require("../utils/httpError");

async function getAllTenants() {
  return prisma.tenant.findMany({
    select: { id: true, name: true, createdAt: true, updatedAt: true },
    orderBy: { name: "asc" },
  });
}

async function createTenant(rawName) {
  const name = typeof rawName === "string" ? rawName.trim() : "";
  if (!name) {
    throw new HttpError(400, "Validation failed.", [{ field: "name", message: "name must be a non-empty string." }]);
  }
  if (name.length > 120) {
    throw new HttpError(400, "Validation failed.", [{ field: "name", message: "name must be 120 characters or fewer." }]);
  }

  return prisma.tenant.create({
    data: { name },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
  });
}

module.exports = {
  getAllTenants,
  createTenant,
};
