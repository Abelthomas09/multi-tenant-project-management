require("dotenv").config();

const cors = require("cors");
const express = require("express");
const { validateEnvironment } = require("./config/env");
const { errorHandler } = require("./middleware/errorHandler");
const { notFound } = require("./middleware/notFound");
const { apiLimiter } = require("./middleware/rateLimiters");
const { authRoutes } = require("./routes/authRoutes");
const { projectRoutes } = require("./routes/projectRoutes");
const { userRoutes } = require("./routes/userRoutes");
const { permissionRoutes } = require("./routes/permissionRoutes");
const { tenantRoutes } = require("./routes/tenantRoutes");

validateEnvironment();

const app = express();
const port = Number(process.env.PORT || 4000);

app.disable("x-powered-by");
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(apiLimiter);

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "API is healthy", data: { status: "ok" } });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/users", userRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/tenants", tenantRoutes);

app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  app.listen(port, () => console.log(`API listening on port ${port}`));
}

module.exports = app;
