const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("=== 1. VERIFY USER PASSWORDS & ROLES ===");
  const director = await prisma.user.findUnique({
    where: { email: "sunita.rao@tribal.gov.in" },
  });
  console.log("Found Operations Director:", director?.name, director?.role);
  const isValidPass = await bcrypt.compare("Director@123456", director?.passwordHash || "");
  console.log("Director Password verification (Director@123456):", isValidPass ? "PASS" : "FAIL");

  console.log("\n=== 2. VERIFY CASE DOSSIERS & METRICS IN DATABASE ===");
  const dossiers = await prisma.caseDossier.findMany({
    include: {
      application: {
        include: {
          applicant: true,
          schemeVersion: {
            include: { scheme: true },
          },
        },
      },
      deficiencies: true,
      ruleResults: true,
      assignedOfficer: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  console.log(`Total Case Dossiers: ${dossiers.length}`);
  dossiers.forEach((d) => {
    console.log(
      `  - Dossier ${d.caseNumber}: Stage=${d.stage}, State=${d.state}, Scheme=${d.application?.schemeVersion?.scheme?.code}, Deficiencies=${d.deficiencies.length}, Rules=${d.ruleResults.length}`
    );
  });

  console.log("\n=== 3. VERIFY OPERATIONS ANALYTICS SERVICE LAYER ===");
  // Dynamic import of TS compiled or direct TS execution test via tsx
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
