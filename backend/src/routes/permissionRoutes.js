const express = require("express");
const { RoleName } = require("@prisma/client");
const permissionController = require("../controllers/permissionController");
const { authenticate } = require("../middleware/authenticate");
const { requirePermissions } = require("../middleware/authorize");
const { HttpError } = require("../utils/httpError");

const router = express.Router();

function requireSuperAdmin(req, res, next) {
  if (req.auth.role !== RoleName.SUPER_ADMIN) {
    return next(new HttpError(403, "Only Super Admins can manage role permissions."));
  }
  next();
}

router.use(authenticate, requireSuperAdmin, requirePermissions("permissions.manage"));

router.get("/admin", permissionController.getAdminPermissions);
router.put("/admin", permissionController.updateAdminPermissions);

module.exports = { permissionRoutes: router };
