const jwt = require("jsonwebtoken");
const { prisma } = require("../lib/prisma");
const { HttpError } = require("../utils/httpError");

function getBearerToken(authorization) {
  if (typeof authorization !== "string") return null;

  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

function collectPermissions(user) {
  return [
    ...new Set([
      ...user.role.rolePermissions.map(({ permission }) => permission.code),
      ...user.userPermissions.map(({ permission }) => permission.code),
    ]),
  ];
}

async function authenticate(req, res, next) {
  try {
    const token = getBearerToken(req.get("authorization"));
    if (!token) throw new HttpError(401, "Authentication token is required.");

    let claims;
    try {
      claims = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ["HS256"],
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE,
      });
    } catch {
      throw new HttpError(401, "Authentication token is invalid or expired.");
    }

    const user = await prisma.user.findUnique({
      where: { id: claims.sub },
      include: {
        role: { include: { rolePermissions: { include: { permission: true } } } },
        userPermissions: { include: { permission: true } },
      },
    });

    if (!user || !user.isActive) throw new HttpError(401, "Authentication token is no longer valid.");

    req.auth = {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
      tenantId: user.tenantId,
      permissions: collectPermissions(user),
    };

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { authenticate, collectPermissions };
