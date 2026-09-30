import fs from "fs";
import path from "path";
import { PrismaClient, ProcessingStatus, DocumentType } from "@prisma/client";
import { documentProcessingService } from "../src/server/services/document-processing.service";
import { applicationService } from "../src/server/services/application.service";
import { defaultStorage } from "../src/server/storage/local-storage.adapter";

const prisma = new PrismaClient();

async function main() {
  console.log("=== 1. RE-PROCESS EXISTING DEGREE TRANSCRIPT ===");
  const doc = await prisma.document.findUnique({
    where: { id: "6ed1d9b7-3237-485b-8cce-a74c4f120c6a" },
    include: { extractedFields: true, processingJob: true },
  });

  if (doc && doc.processingJob) {
    console.log(`Re-processing doc ${doc.id} (Job ${doc.processingJob.id})...`);
    // Delete existing extracted fields so extractor recreates them
    await prisma.extractedField.deleteMany({ where: { documentId: doc.id } });
    await prisma.documentProcessingJob.update({
      where: { id: doc.processingJob.id },
      data: { status: ProcessingStatus.PENDING, startedAt: null, completedAt: null },
    });
    // Set DEMO_OCR_DELAY_MS temporarily to 1000 for this existing re-run
    process.env.DEMO_OCR_DELAY_MS = "1000";
    await documentProcessingService.processJob(doc.processingJob.id);
    
    const updatedDoc = await prisma.document.findUnique({
      where: { id: doc.id },
      include: { extractedFields: true },
    });
    console.log(`Updated fields count: ${updatedDoc?.extractedFields.length}`);
    for (const f of updatedDoc?.extractedFields || []) {
      console.log(`  - ${f.fieldKey}: "${f.normalizedValue}" (Conf: ${f.confidenceScore}, bbox: [x:${f.boundingBoxX}, y:${f.boundingBoxY}, w:${f.boundingBoxWidth}, h:${f.boundingBoxHeight}])`);
    }
  }

  console.log("\n=== 2. TEST PREVIEW BUFFER ENDPOINT LOGIC ===");
  if (doc) {
    const preview = await applicationService.getPreviewBuffer(
      doc.storagePath,
      { id: "usr_demo_officer_001", role: "VERIFICATION_OFFICER", permissions: ["document:read:all"], isActive: true } as any,
      { format: "image" }
    );
    console.log(`Preview format=image returned mimeType: ${preview.mimeType}, size: ${preview.buffer.length} bytes`);
  }

  console.log("\n=== 3. SIMULATE NEW DEMO UPLOAD WITH 35s DELAY ===");
  // Set DEMO_OCR_DELAY_MS to 35000
  process.env.DEMO_OCR_DELAY_MS = "35000";
  
  // Find an active draft or case
  const app = await prisma.application.findFirst({
    include: { caseDossier: true },
  });

  if (app && app.caseDossier) {
    const pdfPath = path.resolve(process.cwd(), "tests/fixtures/documents/demo-degree-transcript.pdf");
    const pdfBuf = fs.readFileSync(pdfPath);

    console.log(`Uploading demo-degree-transcript.pdf to Case Dossier ${app.caseDossier.id}...`);
    const uploadStart = Date.now();
    const uploaded = await applicationService.uploadDocument(
      app.id,
      DocumentType.DEGREE_TRANSCRIPT,
      {
        fileName: "demo-degree-transcript.pdf",
        mimeType: "application/pdf",
        buffer: pdfBuf,
      },
      { id: app.submittedById, role: "APPLICANT", permissions: ["document:upload:own", "document:read:own"], isActive: true } as any
    );
    console.log(`Document uploaded with ID: ${uploaded.id}, Status: ${uploaded.processingStatus}`);

    // Check status after 5s (should be PROCESSING or PENDING)
    await new Promise((r) => setTimeout(r, 5000));
    const midDoc = await prisma.document.findUnique({
      where: { id: uploaded.id },
      include: { processingJob: true },
    });
    console.log(`Status after 5s: Document=${midDoc?.processingStatus}, Job=${midDoc?.processingJob?.status}`);

    console.log("Waiting for processing to complete (~30s remaining)...");
    let completed = false;
    while (!completed && (Date.now() - uploadStart) < 50000) {
      await new Promise((r) => setTimeout(r, 2000));
      const checkDoc = await prisma.document.findUnique({
        where: { id: uploaded.id },
        include: { processingJob: true, extractedFields: true },
      });
      if (checkDoc?.processingStatus === ProcessingStatus.COMPLETED) {
        completed = true;
        const totalSec = ((Date.now() - uploadStart) / 1000).toFixed(1);
        console.log(`\nDocument COMPLETED in ${totalSec}s!`);
        console.log(`Job Completed At: ${checkDoc.processingJob?.completedAt}`);
        console.log(`Extracted Fields (${checkDoc.extractedFields.length}):`);
        for (const f of checkDoc.extractedFields) {
          console.log(`  - ${f.fieldKey}: "${f.normalizedValue}" (Conf: ${f.confidenceScore}, bbox: [x:${f.boundingBoxX}, y:${f.boundingBoxY}, w:${f.boundingBoxWidth}, h:${f.boundingBoxHeight}])`);
        }

        // Test preview image on newly uploaded doc
        const newPreview = await applicationService.getPreviewBuffer(
          checkDoc.storagePath,
          { id: "usr_demo_officer_001", role: "VERIFICATION_OFFICER", permissions: ["document:read:all"], isActive: true } as any,
          { format: "image" }
        );
        console.log(`New doc preview format=image returned mimeType: ${newPreview.mimeType}, size: ${newPreview.buffer.length} bytes`);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
