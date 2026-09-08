const express = require("express");
const { RoleName } = require("@prisma/client");
const userController = require("../controllers/userController");
const { authenticate } = require("../middleware/authenticate");
const { requirePermissions } = require("../middleware/authorize");
const { requireTenantScope } = require("../middleware/tenantIsolation");
const { HttpError } = require("../utils/httpError");

const router = express.Router();

function requireSuperAdmin(req, res, next) {
  if (req.auth.role !== RoleName.SUPER_ADMIN) {
    return next(new HttpError(403, "Only Super Admins can manage Agent permissions."));
  }
  next();
}

router.use(authenticate, requireTenantScope);

router.get("/", requirePermissions("users.read"), userController.getUsers);
router.post("/", requirePermissions("users.create"), userController.createUser);
router.get("/:id/permissions", requireSuperAdmin, requirePermissions("permissions.manage"), userController.getAgentPermissions);
router.put("/:id/permissions", requireSuperAdmin, requirePermissions("permissions.manage"), userController.updateAgentPermissions);
router.patch("/:id", requirePermissions("users.update"), userController.updateUser);
router.patch("/:id/status", requirePermissions("users.disable"), userController.updateUserStatus);

module.exports = { userRoutes: router };
