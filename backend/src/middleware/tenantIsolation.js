const { prisma } = require("../lib/prisma");
const { HttpError } = require("../utils/httpError");

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function requireTenantScope(req, res, next) {
  try {
    if (!req.auth) throw new HttpError(401, "Authentication is required.");

    const requestedTenantId = req.get("x-tenant-id");

    if (req.auth.role !== "SUPER_ADMIN") {
      if (!req.auth.tenantId) throw new HttpError(403, "This user is not assigned to a tenant.");
      if (requestedTenantId && requestedTenantId !== req.auth.tenantId) {
        throw new HttpError(403, "You cannot access another tenant.");
      }

      req.tenant = { id: req.auth.tenantId };
      return next();
    }

    if (!requestedTenantId) {
      throw new HttpError(400, "Super Admin requests must include an X-Tenant-Id header.");
    }
    if (!uuidPattern.test(requestedTenantId)) {
      throw new HttpError(400, "X-Tenant-Id must be a valid tenant ID.");
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: requestedTenantId },
      select: { id: true },
    });
    if (!tenant) throw new HttpError(404, "Tenant not found.");

    req.tenant = tenant;
    next();
  } catch (error) {
    next(error);
  }
}

function tenantWhere(req, additionalFilters = {}) {
  if (!req.tenant) throw new Error("Tenant scope is required before constructing a tenant query.");
  return { ...additionalFilters, tenantId: req.tenant.id };
}

module.exports = { requireTenantScope, tenantWhere };
