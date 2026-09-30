import fs from "fs";
import path from "path";
import { PrismaClient, DocumentType } from "@prisma/client";
import { applicationService } from "../src/server/services/application.service";

const prisma = new PrismaClient();

async function main() {
  console.log("=== TESTING AI DOCUMENT MISMATCH / BLUR / INFO DETECTION ===");

  // 1. Find draft application
  const app = await prisma.application.findFirst({
    where: { id: "app_demo_nfst_draft_001" },
    include: { caseDossier: true },
  });

  if (!app || !app.caseDossier) {
    throw new Error("Draft application not found");
  }

  // 2. Upload demo-admission-offer.pdf under CASTE_CERTIFICATE requirement (Deliberate Mismatch)
  const pdfPath = path.resolve(process.cwd(), "tests/fixtures/documents/demo-admission-offer.pdf");
  const pdfBuf = fs.readFileSync(pdfPath);

  console.log("Uploading demo-admission-offer.pdf under CASTE_CERTIFICATE (Deliberate Mismatch)...");
  process.env.DEMO_OCR_DELAY_MS = "1000"; // Fast 1s for test

  const uploaded = await applicationService.uploadDocument(
    app.id,
    DocumentType.CASTE_CERTIFICATE,
    {
      fileName: "demo-admission-offer.pdf",
      mimeType: "application/pdf",
      buffer: pdfBuf,
    },
    { id: app.submittedById, role: "APPLICANT", permissions: ["document:upload:own", "document:read:own"], isActive: true } as any
  );

  console.log(`Uploaded doc ID: ${uploaded.id}, Status: ${uploaded.processingStatus}`);

  // Wait 3s for fast async processing
  await new Promise((r) => setTimeout(r, 3000));

  // 3. Fetch checklist and inspect AI Audit result
  const checklist = await applicationService.getChecklist(
    app.id,
    { id: app.submittedById, role: "APPLICANT", permissions: ["application:read:own"], isActive: true } as any
  );

  const casteItem = checklist.find((c) => c.documentType === DocumentType.CASTE_CERTIFICATE);
  console.log("\n=== CHECKLIST AI AUDIT RESULT ===");
  console.log("Document Item:", casteItem?.label);
  console.log("Uploaded File:", casteItem?.uploadedDocument?.originalFilename);
  console.log("Processing Status:", casteItem?.uploadedDocument?.processingStatus);
  console.log("Classified As:", casteItem?.uploadedDocument?.classifiedAs);
  console.log("AI Audit:", JSON.stringify(casteItem?.uploadedDocument?.aiAudit, null, 2));

  console.log("\n=== TEST COMPLETED SUCCESSFULLY ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
