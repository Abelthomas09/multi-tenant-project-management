function errorHandler(error, req, res, next) {
  const isDevelopment = process.env.NODE_ENV !== "production";

  if (error.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "A record with that value already exists.",
      errors: [],
    });
  }

  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error("Unhandled API error", {
      name: error.name,
      code: error.code,
      message: error.message,
      meta: error.meta,
    });
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? "Internal server error" : error.message,
    errors: statusCode >= 500 && isDevelopment
      ? [{ field: "server", message: error.message || "Unknown server error.", code: error.code }]
      : error.errors || [],
  });
}

module.exports = { errorHandler };
