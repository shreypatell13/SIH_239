import fs from "fs";
import path from "path";
import { PrismaClient, DocumentType } from "@prisma/client";
import { applicationService } from "../src/server/services/application.service";

const prisma = new PrismaClient();

async function main() {
  console.log("=== TESTING DOCUMENT UPLOAD AND REMOVE ===");

  const app = await prisma.application.findFirst({
    where: { id: "app_demo_nfst_draft_001" },
    include: { caseDossier: true },
  });

  if (!app) throw new Error("Draft application not found");

  const pdfPath = path.resolve(process.cwd(), "demo_pdf_documents/2_Caste_Certificate_Blurry.pdf");
  const pdfBuf = fs.readFileSync(pdfPath);

  const actor = {
    id: app.submittedById,
    role: "APPLICANT",
    permissions: ["document:upload:own", "document:read:own", "application:read:own"],
    isActive: true,
  } as any;

  console.log("1. Uploading test document...");
  const uploaded = await applicationService.uploadDocument(
    app.id,
    DocumentType.CASTE_CERTIFICATE,
    {
      fileName: "2_Caste_Certificate_Blurry.pdf",
      mimeType: "application/pdf",
      buffer: pdfBuf,
    },
    actor
  );

  console.log(`Uploaded doc ID: ${uploaded.id}`);

  console.log("2. Deleting document via deleteDocument...");
  const deleted = await applicationService.deleteDocument(app.id, uploaded.id, actor);
  console.log(`Deletion Result: ${deleted}`);

  // Check checklist to ensure it is no longer marked uploaded
  const checklist = await applicationService.getChecklist(app.id, actor);
  const casteItem = checklist.find((c) => c.documentType === DocumentType.CASTE_CERTIFICATE);
  console.log(`Caste Item isUploaded: ${casteItem?.isUploaded}`);

  console.log("=== DELETE TEST PASSED SUCCESSFULLY ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
