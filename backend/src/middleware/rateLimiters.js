const { rateLimit } = require("express-rate-limit");

const loginRateLimitEnabled = process.env.LOGIN_RATE_LIMIT_ENABLED !== "false";

function rateLimitHandler(req, res, next, options) {
  res.status(options.statusCode).json({
    success: false,
    message: "Too many requests. Please try again later.",
    errors: [],
  });
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: () => !loginRateLimitEnabled,
  handler: rateLimitHandler,
});

module.exports = { apiLimiter, loginLimiter };
