const permissionService = require("../services/permissionService");

async function getAdminPermissions(req, res, next) {
  try {
    const data = await permissionService.getAdminPermissionData();
    res.status(200).json({ success: true, message: "Admin permissions retrieved.", data });
  } catch (error) {
    next(error);
  }
}

async function updateAdminPermissions(req, res, next) {
  try {
    const data = await permissionService.updateAdminPermissions(req.body?.permissionCodes);
    res.status(200).json({ success: true, message: "Admin permissions updated.", data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAdminPermissions,
  updateAdminPermissions,
};
