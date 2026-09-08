const express = require("express");
const projectController = require("../controllers/projectController");
const { authenticate } = require("../middleware/authenticate");
const { requirePermissions } = require("../middleware/authorize");
const { requireTenantScope } = require("../middleware/tenantIsolation");

const router = express.Router();

router.use(authenticate, requireTenantScope);

router.get("/", requirePermissions("projects.read"), projectController.getProjects);
router.post("/", requirePermissions("projects.create"), projectController.createProject);
router.get("/:id", requirePermissions("projects.read"), projectController.getProject);
router.patch("/:id", requirePermissions("projects.update"), projectController.updateProject);
router.delete("/:id", requirePermissions("projects.delete"), projectController.deleteProject);

module.exports = { projectRoutes: router };
