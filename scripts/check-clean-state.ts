import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function check() {
  const nfstCase = await prisma.caseDossier.findUnique({
    where: { id: "case_demo_nfst_001" },
    include: { documents: true, deficiencies: true },
  });
  console.log("NFST Case (Clean Draft):", {
    id: nfstCase?.id,
    stage: nfstCase?.currentStage,
    state: nfstCase?.currentState,
    blocker: nfstCase?.blocker,
    docsCount: nfstCase?.documents.length,
    deficienciesCount: nfstCase?.deficiencies.length,
  });

  const nosCase = await prisma.caseDossier.findUnique({
    where: { id: "case_demo_nos_001" },
    include: { documents: true },
  });
  console.log("NOS Case (Verified Baseline):", {
    id: nosCase?.id,
    stage: nosCase?.currentStage,
    state: nosCase?.currentState,
    docsCount: nosCase?.documents.length,
  });
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
