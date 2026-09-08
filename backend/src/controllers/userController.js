const userService = require("../services/userService");

async function getUsers(req, res, next) {
  try {
    const data = await userService.getUsers(req, req.query);
    res.status(200).json({ success: true, message: "Users retrieved.", data });
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const user = await userService.createUser(req);
    res.status(201).json({ success: true, message: "User created.", data: { user } });
  } catch (error) {
    next(error);
  }
}

async function getAgentPermissions(req, res, next) {
  try {
    const data = await userService.getAgentPermissions(req, req.params.id);
    res.status(200).json({ success: true, message: "Agent permissions retrieved.", data });
  } catch (error) {
    next(error);
  }
}

async function updateAgentPermissions(req, res, next) {
  try {
    const data = await userService.updateAgentPermissions(req, req.params.id, req.body?.permissionCodes);
    res.status(200).json({ success: true, message: "Agent permissions updated.", data });
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const user = await userService.updateUser(req, req.params.id);
    res.status(200).json({ success: true, message: "User updated.", data: { user } });
  } catch (error) {
    next(error);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const user = await userService.updateUserStatus(req, req.params.id, (req.body || {}).isActive);
    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? "enabled" : "disabled"}.`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getUsers,
  createUser,
  getAgentPermissions,
  updateAgentPermissions,
  updateUser,
  updateUserStatus,
};
