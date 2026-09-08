const requiredEnvironmentVariables = ["DATABASE_URL", "JWT_SECRET"];

function validateEnvironment() {
  const missing = requiredEnvironmentVariables.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  process.env.JWT_EXPIRES_IN ||= "1h";
  process.env.JWT_ISSUER ||= "multi-tenant-project-management";
  process.env.JWT_AUDIENCE ||= "multi-tenant-project-management-api";
}

module.exports = { validateEnvironment };
