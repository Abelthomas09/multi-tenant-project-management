const projectService = require("../services/projectService");

async function getProjects(req, res, next) {
  try {
    const data = await projectService.getProjects(req, req.query);
    res.status(200).json({ success: true, message: "Projects retrieved.", data });
  } catch (error) {
    next(error);
  }
}

async function createProject(req, res, next) {
  try {
    const project = await projectService.createProject(req, req.body);
    res.status(201).json({ success: true, message: "Project created.", data: { project } });
  } catch (error) {
    next(error);
  }
}

async function getProject(req, res, next) {
  try {
    const project = await projectService.getProjectById(req, req.params.id);
    res.status(200).json({ success: true, message: "Project retrieved.", data: { project } });
  } catch (error) {
    next(error);
  }
}

async function updateProject(req, res, next) {
  try {
    const project = await projectService.updateProject(req, req.params.id, req.body);
    res.status(200).json({ success: true, message: "Project updated.", data: { project } });
  } catch (error) {
    next(error);
  }
}

async function deleteProject(req, res, next) {
  try {
    await projectService.deleteProject(req, req.params.id);
    res.status(200).json({ success: true, message: "Project deleted.", data: null });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
};
