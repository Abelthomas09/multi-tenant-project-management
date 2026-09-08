const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

function getDatabaseUrl() {
	const databaseUrl = new URL(process.env.DATABASE_URL);
	const sslMode = databaseUrl.searchParams.get("sslmode");

	if (["prefer", "require", "verify-ca"].includes(sslMode)) {
		databaseUrl.searchParams.set("sslmode", "verify-full");
	}

	return databaseUrl.toString();
}

const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });

const prisma = new PrismaClient({ adapter });

module.exports = { prisma };
