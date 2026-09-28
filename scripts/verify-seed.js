const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Connecting to database...");
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, name: true },
  });
  console.log("Total Users:", users.length);
  users.forEach((u) => console.log(`  - [${u.role}] ${u.email} (${u.name})`));

  const schemes = await prisma.scheme.count();
  const versions = await prisma.schemeVersion.count();
  const applications = await prisma.application.count();
  const dossiers = await prisma.caseDossier.count();
  const deficiencies = await prisma.deficiency.count();
  const documents = await prisma.document.count();

  console.log("\nEntity Counts:");
  console.log("  - Schemes:", schemes);
  console.log("  - Scheme Versions:", versions);
  console.log("  - Applications:", applications);
  console.log("  - Case Dossiers:", dossiers);
  console.log("  - Deficiencies:", deficiencies);
  console.log("  - Documents:", documents);
}

main()
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
