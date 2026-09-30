import fs from "fs";
import path from "path";
import { PrismaClient, DocumentType } from "@prisma/client";
import { applicationService } from "../src/server/services/application.service";

const prisma = new PrismaClient();

async function testScenario(filename: string, reqType: DocumentType, description: string) {
  console.log(`\n==================================================`);
  console.log(`TEST SCENARIO: ${description}`);
  console.log(`File: ${filename} -> Requirement: ${reqType}`);
  console.log(`==================================================`);

  const app = await prisma.application.findFirst({
    where: { id: "app_demo_nfst_draft_001" },
    include: { caseDossier: true },
  });

  if (!app) throw new Error("Draft application not found");

  const pdfPath = path.resolve(process.cwd(), "tests/fixtures/documents", filename);
  const pdfBuf = fs.readFileSync(pdfPath);

  process.env.DEMO_OCR_DELAY_MS = "1000";

  const uploaded = await applicationService.uploadDocument(
    app.id,
    reqType,
    {
      fileName: filename,
      mimeType: "application/pdf",
      buffer: pdfBuf,
    },
    { id: app.submittedById, role: "APPLICANT", permissions: ["document:upload:own", "document:read:own"], isActive: true } as any
  );

  // Wait 3s for processing
  await new Promise((r) => setTimeout(r, 3000));

  const checklist = await applicationService.getChecklist(
    app.id,
    { id: app.submittedById, role: "APPLICANT", permissions: ["application:read:own"], isActive: true } as any
  );

  const item = checklist.find((c) => c.documentType === reqType);
  console.log(`Verdict: ${item?.uploadedDocument?.aiAudit?.overallVerdict}`);
  console.log(`Summary Title: ${item?.uploadedDocument?.aiAudit?.summaryTitle}`);
  console.log(`Summary Message: ${item?.uploadedDocument?.aiAudit?.summaryMessage}`);
  console.log(`Mismatch Detected: ${item?.uploadedDocument?.aiAudit?.mismatchDetected}`);
  console.log(`Quality Warning:`, item?.uploadedDocument?.aiAudit?.qualityWarning);
  console.log(`Info Mismatches:`, item?.uploadedDocument?.aiAudit?.infoMismatches);
  console.log(`Actionable Guidance: ${item?.uploadedDocument?.aiAudit?.actionableGuidance}`);
}

async function main() {
  await testScenario("demo-admission-offer.pdf", DocumentType.CASTE_CERTIFICATE, "1. Document Type Mismatch (Admission Letter uploaded for ST Certificate)");
  await testScenario("demo-caste-certificate-mismatch-name.pdf", DocumentType.CASTE_CERTIFICATE, "2. Name Mismatch (SURESH KUMAR MEENA on certificate vs RAMESH KUMAR MEENA in form)");
  await testScenario("demo-caste-certificate-mismatch-category.pdf", DocumentType.CASTE_CERTIFICATE, "3. Social Category Mismatch (OBC on certificate vs ST in form)");
  await testScenario("demo-income-certificate-mismatch-amount.pdf", DocumentType.INCOME_CERTIFICATE, "4. Income Mismatch (₹9,50,000 on certificate vs ₹4,50,000 in form)");
  await testScenario("demo-blurry-caste-certificate.pdf", DocumentType.CASTE_CERTIFICATE, "5. Blur / Quality Warning (Slightly blurry scan)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
