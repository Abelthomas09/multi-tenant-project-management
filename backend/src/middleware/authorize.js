const { HttpError } = require("../utils/httpError");

function requirePermissions(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.auth) return next(new HttpError(401, "Authentication is required."));

    const missingPermissions = requiredPermissions.filter(
      (permission) => !req.auth.permissions.includes(permission),
    );

    if (missingPermissions.length > 0) {
      return next(new HttpError(403, "You do not have permission to perform this action."));
    }

    next();
  };
}

module.exports = { requirePermissions };
