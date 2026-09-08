const tenantService = require("../services/tenantService");

async function getTenants(req, res, next) {
  try {
    const tenants = await tenantService.getAllTenants();
    res.status(200).json({ success: true, message: "Tenants retrieved.", data: { tenants } });
  } catch (error) {
    next(error);
  }
}

async function createTenant(req, res, next) {
  try {
    const tenant = await tenantService.createTenant(req.body?.name);
    res.status(201).json({ success: true, message: "Tenant created.", data: { tenant } });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTenants,
  createTenant,
};
