const authService = require("../services/authService");

async function login(req, res, next) {
  try {
    const data = await authService.loginUser(req.body?.email, req.body?.password);
    res.status(200).json({
      success: true,
      message: "Login successful.",
      data,
    });
  } catch (error) {
    next(error);
  }
}

function getMe(req, res) {
  res.status(200).json({
    success: true,
    message: "Authenticated user retrieved.",
    data: { user: req.auth },
  });
}

module.exports = {
  login,
  getMe,
};
