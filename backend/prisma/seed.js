require("dotenv").config();

const bcrypt = require("bcryptjs");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient, ProjectStatus, RoleName } = require("@prisma/client");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const permissions = [
  ["users.read", "View users within the authorized scope."],
  ["users.create", "Create users within the authorized scope."],
  ["users.update", "Update users within the authorized scope."],
  ["users.disable", "Enable or disable users within the authorized scope."],
  ["projects.read", "View projects within the authorized tenant scope."],
  ["projects.create", "Create projects within the authorized tenant scope."],
  ["projects.update", "Update projects within the authorized tenant scope."],
  ["projects.delete", "Delete projects within the authorized tenant scope."],
  ["permissions.manage", "Manage role permission assignments."],
];

const rolePermissionCodes = {
  [RoleName.SUPER_ADMIN]: permissions.map(([code]) => code),
  [RoleName.ADMIN]: [
    "users.read",
    "users.create",
    "users.update",
    "users.disable",
    "projects.read",
    "projects.create",
    "projects.update",
    "projects.delete",
  ],
  [RoleName.AGENT]: ["projects.read"],
};

async function upsertUser({ email, firstName, lastName, tenantId, roleId }) {
  const passwordHash = await bcrypt.hash("Password123!", 12);

  return prisma.user.upsert({
    where: { email },
    update: { firstName, lastName, tenantId, roleId, passwordHash, isActive: true },
    create: { email, firstName, lastName, tenantId, roleId, passwordHash },
  });
}

async function main() {
  const permissionRecords = await Promise.all(
    permissions.map(([code, description]) =>
      prisma.permission.upsert({ where: { code }, update: { description }, create: { code, description } }),
    ),
  );
  const permissionByCode = Object.fromEntries(permissionRecords.map((permission) => [permission.code, permission]));

  const roles = await Promise.all(
    Object.values(RoleName).map((name) => prisma.role.upsert({ where: { name }, update: {}, create: { name } })),
  );
  const roleByName = Object.fromEntries(roles.map((role) => [role.name, role]));

  for (const [roleName, codes] of Object.entries(rolePermissionCodes)) {
    const role = roleByName[roleName];
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: codes.map((code) => ({ roleId: role.id, permissionId: permissionByCode[code].id })),
    });
  }

  const tenantA = await prisma.tenant.upsert({ where: { name: "Tenant A" }, update: {}, create: { name: "Tenant A" } });
  const tenantB = await prisma.tenant.upsert({ where: { name: "Tenant B" }, update: {}, create: { name: "Tenant B" } });

  await upsertUser({
    email: "superadmin@example.com",
    firstName: "System",
    lastName: "Administrator",
    tenantId: null,
    roleId: roleByName[RoleName.SUPER_ADMIN].id,
  });
  await prisma.project.deleteMany({ where: { name: { in: ["WaziApp", "Tenant A CRM", "Tenant B Support"] } } });
  await prisma.project.createMany({
    data: [
      { name: "WaziApp", address: "Infopark, Thrissur, Kerala", useCase: "WhatsApp customer communication and support", status: ProjectStatus.ACTIVE, tenantId: tenantA.id },
      { name: "Tenant A CRM", address: "Kochi, Kerala", useCase: "Customer relationship management", status: ProjectStatus.DRAFT, tenantId: tenantA.id },
      { name: "Tenant B Support", address: "Bengaluru, Karnataka", useCase: "Customer support operations", status: ProjectStatus.ACTIVE, tenantId: tenantB.id },
    ],
  });

  console.log("Database seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
