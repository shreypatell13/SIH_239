/**
 * Document Intelligence Demo Scenarios Registry
 * Defines configuration for Normal, Information Mismatch, and Blurred document test fixtures.
 */

import { DocumentType } from "@prisma/client";

export type DemoScenarioType = "NORMAL" | "INFO_MISMATCH" | "BLUR";

export interface DemoScenarioItem {
  id: string;
  scenarioType: DemoScenarioType;
  documentType: DocumentType;
  fileName: string;
  relativeFilePath: string;
  title: string;
  description: string;
  syntheticLabel: string;
  expectedFormValue?: {
    fieldKey: string;
    fieldLabel: string;
    value: string | number;
  };
  expectedDocumentValue?: {
    fieldKey: string;
    fieldLabel: string;
    value: string | number;
  };
  expectedOutcome: "VERIFIED" | "REVIEW_REQUIRED" | "QUALITY_WARNING";
  explanation: string;
}

export const DEMO_SCENARIOS: DemoScenarioItem[] = [
  // ----------------------------------------------------
  // 1. NORMAL SCENARIOS (AI-Verified, Clean, Matching)
  // ----------------------------------------------------
  {
    id: "normal-caste-cert",
    scenarioType: "NORMAL",
    documentType: DocumentType.CASTE_CERTIFICATE,
    fileName: "demo-st-caste-certificate.pdf",
    relativeFilePath: "tests/fixtures/documents/demo-scenarios/normal/demo-st-caste-certificate.pdf",
    title: "Scheduled Tribe Certificate (Clean)",
    description: "Standard clean ST caste certificate matching applicant's demographic profile.",
    syntheticLabel: "SYNTHETIC DEMO DOCUMENT — NOT A REAL GOVERNMENT RECORD",
    expectedFormValue: { fieldKey: "casteCategory", fieldLabel: "Caste / Tribe Category", value: "ST" },
    expectedDocumentValue: { fieldKey: "casteCategory", fieldLabel: "Social Category", value: "SCHEDULED TRIBE (ST)" },
    expectedOutcome: "VERIFIED",
    explanation: "Document classification, text clarity, and candidate category matched successfully.",
  },
  {
    id: "normal-income-cert",
    scenarioType: "NORMAL",
    documentType: DocumentType.INCOME_CERTIFICATE,
    fileName: "demo-income-certificate.pdf",
    relativeFilePath: "tests/fixtures/documents/demo-scenarios/normal/demo-income-certificate.pdf",
    title: "Income Certificate (₹3,00,000)",
    description: "Valid annual income certificate showing INR 3,00,000 matching declared form amount.",
    syntheticLabel: "SYNTHETIC DEMO DOCUMENT — NOT A REAL GOVERNMENT RECORD",
    expectedFormValue: { fieldKey: "annualFamilyIncome", fieldLabel: "Annual Family Income", value: 300000 },
    expectedDocumentValue: { fieldKey: "annualFamilyIncome", fieldLabel: "Annual Family Income", value: 300000 },
    expectedOutcome: "VERIFIED",
    explanation: "Declared income matches extracted revenue record within threshold.",
  },
  {
    id: "normal-admission-offer",
    scenarioType: "NORMAL",
    documentType: DocumentType.ADMISSION_OFFER_LETTER,
    fileName: "demo-admission-offer.pdf",
    relativeFilePath: "tests/fixtures/documents/demo-scenarios/normal/demo-admission-offer.pdf",
    title: "University Ph.D. Admission Letter",
    description: "Regular doctoral registration letter from University of Rajasthan.",
    syntheticLabel: "SYNTHETIC DEMO DOCUMENT — NOT A REAL GOVERNMENT RECORD",
    expectedOutcome: "VERIFIED",
    explanation: "Admission credential and enrollment details verified.",
  },
  {
    id: "normal-degree-transcript",
    scenarioType: "NORMAL",
    documentType: DocumentType.DEGREE_TRANSCRIPT,
    fileName: "demo-degree-transcript.pdf",
    relativeFilePath: "tests/fixtures/documents/demo-scenarios/normal/demo-degree-transcript.pdf",
    title: "M.Sc. Consolidated Grade Transcript (72.5%)",
    description: "Master of Science marksheet with 72.5% matching academic declaration.",
    syntheticLabel: "SYNTHETIC DEMO DOCUMENT — NOT A REAL GOVERNMENT RECORD",
    expectedOutcome: "VERIFIED",
    explanation: "Academic transcripts and passing percentage verified deterministically.",
  },

  // ----------------------------------------------------
  // 2. INFORMATION MISMATCH SCENARIOS (Discrepancy / Review Required)
  // ----------------------------------------------------
  {
    id: "mismatch-income-cert",
    scenarioType: "INFO_MISMATCH",
    documentType: DocumentType.INCOME_CERTIFICATE,
    fileName: "demo-income-certificate-mismatch.pdf",
    relativeFilePath: "tests/fixtures/documents/demo-scenarios/info-mismatch/demo-income-certificate-mismatch.pdf",
    title: "Income Inconsistency (Form ₹3,00,000 vs Doc ₹4,50,000)",
    description: "Document states INR 4,50,000 while application form declares INR 3,00,000.",
    syntheticLabel: "SYNTHETIC DEMO DOCUMENT — NOT A REAL GOVERNMENT RECORD",
    expectedFormValue: { fieldKey: "annualFamilyIncome", fieldLabel: "Annual Family Income", value: 300000 },
    expectedDocumentValue: { fieldKey: "annualFamilyIncome", fieldLabel: "Annual Family Income", value: 450000 },
    expectedOutcome: "REVIEW_REQUIRED",
    explanation: "Declared income of ₹3,00,000 does not match extracted income ₹4,50,000 from Income Certificate (Difference: ₹1,50,000). Flagged for human review.",
  },
  {
    id: "mismatch-caste-cert",
    scenarioType: "INFO_MISMATCH",
    documentType: DocumentType.CASTE_CERTIFICATE,
    fileName: "demo-caste-certificate-mismatch.pdf",
    relativeFilePath: "tests/fixtures/documents/demo-scenarios/info-mismatch/demo-caste-certificate-mismatch.pdf",
    title: "Category Inconsistency (Form ST vs Doc OBC)",
    description: "Certificate states OBC (Other Backward Class) whereas application specifies ST.",
    syntheticLabel: "SYNTHETIC DEMO DOCUMENT — NOT A REAL GOVERNMENT RECORD",
    expectedFormValue: { fieldKey: "casteCategory", fieldLabel: "Caste / Tribe Category", value: "ST" },
    expectedDocumentValue: { fieldKey: "casteCategory", fieldLabel: "Social Category", value: "OBC (OTHER BACKWARD CLASS)" },
    expectedOutcome: "REVIEW_REQUIRED",
    explanation: "Declared category 'ST' could not be confirmed against extracted certificate record 'OBC'. Flagged for human review.",
  },
  {
    id: "mismatch-degree-transcript",
    scenarioType: "INFO_MISMATCH",
    documentType: DocumentType.DEGREE_TRANSCRIPT,
    fileName: "demo-degree-transcript-mismatch.pdf",
    relativeFilePath: "tests/fixtures/documents/demo-scenarios/info-mismatch/demo-degree-transcript-mismatch.pdf",
    title: "Marks & Degree Discrepancy (Form 72.5% M.Sc. vs Doc 48.2% B.Com)",
    description: "Transcript indicates B.Com with 48.2% instead of declared M.Sc. with 72.5%.",
    syntheticLabel: "SYNTHETIC DEMO DOCUMENT — NOT A REAL GOVERNMENT RECORD",
    expectedFormValue: { fieldKey: "academicPercentage", fieldLabel: "Qualifying Marks", value: 72.5 },
    expectedDocumentValue: { fieldKey: "academicPercentage", fieldLabel: "Transcript Marks", value: 48.2 },
    expectedOutcome: "REVIEW_REQUIRED",
    explanation: "Transcript marks (48.2%) and degree do not match declared qualifications (72.5%). Flagged for human review.",
  },

  // ----------------------------------------------------
  // 3. BLURRED / DEGRADED QUALITY SCENARIOS (Low OCR Clarity)
  // ----------------------------------------------------
  {
    id: "blur-income-cert",
    scenarioType: "BLUR",
    documentType: DocumentType.INCOME_CERTIFICATE,
    fileName: "demo-income-certificate-blurred.pdf",
    relativeFilePath: "tests/fixtures/documents/demo-scenarios/blur/demo-income-certificate-blurred.pdf",
    title: "Income Certificate (Degraded / Blurry Scan)",
    description: "Physically blurred scan with reduced legibility resulting in lower OCR clarity.",
    syntheticLabel: "SYNTHETIC DEMO DOCUMENT — NOT A REAL GOVERNMENT RECORD",
    expectedOutcome: "QUALITY_WARNING",
    explanation: "Degraded image resolution and blur detected. OCR clarity lowered. Officer review required.",
  },
  {
    id: "blur-caste-cert",
    scenarioType: "BLUR",
    documentType: DocumentType.CASTE_CERTIFICATE,
    fileName: "demo-st-caste-certificate-blurred.pdf",
    relativeFilePath: "tests/fixtures/documents/demo-scenarios/blur/demo-st-caste-certificate-blurred.pdf",
    title: "Scheduled Tribe Certificate (Degraded / Blurry Scan)",
    description: "Physically blurred scan of caste certificate.",
    syntheticLabel: "SYNTHETIC DEMO DOCUMENT — NOT A REAL GOVERNMENT RECORD",
    expectedOutcome: "QUALITY_WARNING",
    explanation: "Low OCR clarity detected on blurred certificate scan. Manual inspection recommended.",
  },
];

export function getDemoScenarioByFilename(filename: string): DemoScenarioItem | undefined {
  const norm = filename.toLowerCase();
  // Exact match first
  const exact = DEMO_SCENARIOS.find((s) => s.fileName.toLowerCase() === norm);
  if (exact) return exact;

  // Sorted by filename length descending so longer/more specific scenario names match first
  const sorted = [...DEMO_SCENARIOS].sort((a, b) => b.fileName.length - a.fileName.length);
  return sorted.find((s) => norm.includes(s.fileName.toLowerCase().replace(".pdf", "")));
}
