const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("../lib/prisma");
const { collectPermissions } = require("../middleware/authenticate");
const { HttpError } = require("../utils/httpError");

function serializeUser(user, permissions) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role.name,
    tenantId: user.tenantId,
    permissions,
  };
}

async function loginUser(rawEmail, rawPassword) {
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  const password = typeof rawPassword === "string" ? rawPassword : "";
  if (!email || !password) throw new HttpError(400, "Email and password are required.");

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      role: { include: { rolePermissions: { include: { permission: true } } } },
      userPermissions: { include: { permission: true } },
    },
  });

  const passwordMatches = user && user.isActive && (await bcrypt.compare(password, user.passwordHash));
  if (!passwordMatches) throw new HttpError(401, "Invalid email or password.");

  const permissions = collectPermissions(user);
  const token = jwt.sign({}, process.env.JWT_SECRET, {
    subject: user.id,
    expiresIn: process.env.JWT_EXPIRES_IN,
    algorithm: "HS256",
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
  });

  return {
    token,
    tokenType: "Bearer",
    expiresIn: process.env.JWT_EXPIRES_IN,
    user: serializeUser(user, permissions),
  };
}

module.exports = {
  serializeUser,
  loginUser,
};
