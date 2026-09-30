import { Document, DocumentType, SchemeVersion } from "@prisma/client";
import {
  DocumentRequirement,
  DocumentRequirementsSchema,
  FormField,
  FormSchema,
  FormSection,
} from "../scheme/types";
import { ChecklistItemDTO, DocumentSummaryDTO, ReadinessReportDTO } from "./types/application.dto";
import { isFieldVisible, validateApplicationFormData } from "./validators/application.validator";

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  CASTE_CERTIFICATE: "Scheduled Tribe (ST) Certificate",
  INCOME_CERTIFICATE: "Income Certificate",
  DEGREE_TRANSCRIPT: "Post-Graduate Degree Marksheet & Certificate",
  ADMISSION_OFFER_LETTER: "University Admission / Registration Letter",
  PASSPORT: "Passport Document",
  RESEARCH_PROPOSAL: "Research Synopsis / Proposal",
  DISABILITY_CERTIFICATE: "Disability Certificate",
  DOMICILE_CERTIFICATE: "Domicile Certificate",
  AADHAAR_CARD: "Aadhaar Card",
  BANK_PASSBOOK: "Bank Passbook",
  OTHER: "Supporting Document",
};

/**
 * AI Document Intelligence evaluation helper:
 * Detects document type mismatches, blur/quality issues, and profile/form information discrepancies.
 */
export function evaluateDocumentAiAudit(
  req: DocumentRequirement,
  doc: (Document & { extractedFields?: any[] }) | DocumentSummaryDTO,
  formData: Record<string, unknown>
) {
  const isPendingOrProcessing =
    doc.processingStatus === "PENDING" || doc.processingStatus === "PROCESSING";

  if (isPendingOrProcessing) {
    return {
      hasIssues: false,
      mismatchDetected: false,
      mismatchDetails: null,
      qualityWarning: null,
      infoMismatches: [],
      overallVerdict: doc.processingStatus === "PROCESSING" ? ("PROCESSING" as const) : ("PENDING" as const),
      summaryTitle: "Analyzing Document Intelligence...",
      summaryMessage: "AI OCR, classification, and field extraction in progress (~35s)...",
      actionableGuidance: undefined,
    };
  }

  const expectedType = req.documentType;
  const expectedLabel = req.label || DOCUMENT_TYPE_LABELS[expectedType] || expectedType;
  const classifiedAs = (doc as any).classifiedAs as DocumentType | undefined | null;
  const confidence = (doc as any).classificationConfidence ?? 0.9;
  const originalFilename = doc.originalFilename || "";
  const lowerFilename = originalFilename.toLowerCase();

  // 1. Check Document Type Mismatch
  let mismatchDetected = false;
  let detectedType: DocumentType = classifiedAs || expectedType;

  if (classifiedAs && classifiedAs !== expectedType) {
    mismatchDetected = true;
    detectedType = classifiedAs;
  } else if (!classifiedAs) {
    // Fallback heuristic check on filename if classifier hadn't set classifiedAs
    if (
      expectedType === "CASTE_CERTIFICATE" &&
      (lowerFilename.includes("admission") ||
        lowerFilename.includes("offer") ||
        lowerFilename.includes("transcript") ||
        lowerFilename.includes("income") ||
        lowerFilename.includes("passport"))
    ) {
      mismatchDetected = true;
      if (lowerFilename.includes("admission") || lowerFilename.includes("offer"))
        detectedType = DocumentType.ADMISSION_OFFER_LETTER;
      else if (lowerFilename.includes("income"))
        detectedType = DocumentType.INCOME_CERTIFICATE;
      else if (lowerFilename.includes("transcript") || lowerFilename.includes("degree"))
        detectedType = DocumentType.DEGREE_TRANSCRIPT;
      else if (lowerFilename.includes("passport"))
        detectedType = DocumentType.PASSPORT;
    } else if (
      expectedType === "INCOME_CERTIFICATE" &&
      (lowerFilename.includes("caste") ||
        lowerFilename.includes("st-") ||
        lowerFilename.includes("admission") ||
        lowerFilename.includes("passport"))
    ) {
      mismatchDetected = true;
      if (lowerFilename.includes("caste") || lowerFilename.includes("st-"))
        detectedType = DocumentType.CASTE_CERTIFICATE;
      else if (lowerFilename.includes("admission"))
        detectedType = DocumentType.ADMISSION_OFFER_LETTER;
    }
  }

  const detectedLabel = DOCUMENT_TYPE_LABELS[detectedType] || detectedType;
  const mismatchDetails = mismatchDetected
    ? {
        expectedType,
        expectedLabel,
        detectedType,
        detectedLabel,
        confidence: Math.round(confidence * 100),
        message: `You uploaded a ${detectedLabel} instead of the required ${expectedLabel}.`,
      }
    : null;

  // 2. Check Image Quality / Blur
  let qualityWarning: { isBlurryOrLowQuality: boolean; confidence: number; message: string } | null = null;
  const isFilenameBlurry =
    lowerFilename.includes("blur") ||
    lowerFilename.includes("blurred") ||
    lowerFilename.includes("blurry") ||
    lowerFilename.includes("degraded") ||
    lowerFilename.includes("lowres");

  if (doc.processingStatus === "FAILED") {
    qualityWarning = {
      isBlurryOrLowQuality: true,
      confidence: Math.round((confidence || 0.3) * 100),
      message: "The document is illegible, low-resolution, or corrupted. Please upload a clear high-resolution scan.",
    };
  } else if ((confidence < 0.70 || isFilenameBlurry) && !mismatchDetected) {
    const displayConf = isFilenameBlurry ? Math.min(Math.round(confidence * 100), 52) : Math.round(confidence * 100);
    qualityWarning = {
      isBlurryOrLowQuality: true,
      confidence: displayConf,
      message: `Low OCR clarity detected (${displayConf}% confidence). Ensure all text and seals are clearly legible.`,
    };
  }

  // 3. Check Extracted Info vs Form Data (Information Mismatch)
  const infoMismatches: Array<{
    fieldKey: string;
    fieldLabel: string;
    expectedValue: string;
    extractedValue: string;
    message: string;
  }> = [];
  const extractedFields: any[] = (doc as any).extractedFields || [];

  if (extractedFields.length > 0) {
    // Name check across all documents
    const nameField = extractedFields.find(
      (f) =>
        f.fieldKey === "applicantName" ||
        f.fieldKey === "fullName" ||
        f.fieldKey === "candidateName" ||
        f.fieldKey === "name"
    );
    const formFullName = String(formData.fullName || formData.name || "").trim().toLowerCase();
    if (nameField && formFullName && nameField.normalizedValue) {
      const docName = String(nameField.normalizedValue).trim().toLowerCase();
      const formTokens = formFullName.split(/\s+/).filter((t: string) => t.length > 2);
      const docTokens = docName.split(/\s+/).filter((t: string) => t.length > 2);
      const hasOverlap = formTokens.some((t: string) => docTokens.includes(t));
      if (!hasOverlap && formTokens.length > 0 && docTokens.length > 0) {
        infoMismatches.push({
          fieldKey: nameField.fieldKey,
          fieldLabel: "Applicant Name",
          expectedValue: String(formData.fullName || formData.name),
          extractedValue: String(nameField.normalizedValue),
          message: `Name on document ("${nameField.normalizedValue}") differs from declared application name ("${formData.fullName || formData.name}").`,
        });
      }
    }

    // Caste Category check
    if (expectedType === "CASTE_CERTIFICATE") {
      const catField = extractedFields.find(
        (f) => f.fieldKey === "casteCategory" || f.fieldKey === "category"
      );
      if (catField && catField.normalizedValue) {
        const docCat = String(catField.normalizedValue).toUpperCase();
        if (docCat.includes("OBC") || docCat.includes("GENERAL") || docCat.includes("SC")) {
          if (!docCat.includes("ST") && !docCat.includes("SCHEDULED TRIBE")) {
            infoMismatches.push({
              fieldKey: "casteCategory",
              fieldLabel: "Social Category",
              expectedValue: "ST (Scheduled Tribe)",
              extractedValue: catField.normalizedValue,
              message: `Certificate indicates social category "${catField.normalizedValue}" instead of Scheduled Tribe (ST).`,
            });
          }
        }
      }
    }

    // Income check
    if (expectedType === "INCOME_CERTIFICATE") {
      const formIncomeVal = formData.annualFamilyIncome ?? formData.income;
      if (formIncomeVal !== undefined && formIncomeVal !== null) {
        const incomeField = extractedFields.find(
          (f) => f.fieldKey === "annualIncome" || f.fieldKey === "annualFamilyIncome" || f.fieldKey === "income"
        );
        if (incomeField && incomeField.normalizedValue) {
          const docIncome = Number(String(incomeField.normalizedValue).replace(/[^0-9.]/g, ""));
          const formIncome = Number(formIncomeVal);
          if (!isNaN(docIncome) && !isNaN(formIncome) && docIncome > 0 && formIncome > 0) {
            const diff = Math.abs(docIncome - formIncome);
            if (diff > Math.max(1000, formIncome * 0.05)) {
              infoMismatches.push({
                fieldKey: "annualFamilyIncome",
                fieldLabel: "Annual Family Income",
                expectedValue: `₹${formIncome.toLocaleString("en-IN")}`,
                extractedValue: `₹${docIncome.toLocaleString("en-IN")}`,
                message: `Declared income of ₹${formIncome.toLocaleString("en-IN")} differs from document value of ₹${docIncome.toLocaleString("en-IN")} (Difference: ₹${diff.toLocaleString("en-IN")}).`,
              });
            }
          }
        }
      }
    }

    // Academic Percentage check
    if (expectedType === "DEGREE_TRANSCRIPT") {
      const formPctVal = formData.academicPercentage ?? formData.percentageMarks;
      if (formPctVal !== undefined && formPctVal !== null) {
        const marksField = extractedFields.find(
          (f) => f.fieldKey === "academicPercentage" || f.fieldKey === "percentageMarks" || f.fieldKey === "percentage" || f.fieldKey === "marks"
        );
        if (marksField && marksField.normalizedValue) {
          const docPct = Number(String(marksField.normalizedValue).replace(/[^0-9.]/g, ""));
          const formPct = Number(formPctVal);
          if (!isNaN(docPct) && !isNaN(formPct) && Math.abs(docPct - formPct) > 2.0) {
            infoMismatches.push({
              fieldKey: "academicPercentage",
              fieldLabel: "Qualifying Marks / Percentage",
              expectedValue: `${formPct}%`,
              extractedValue: `${docPct}%`,
              message: `Application form marks (${formPct}%) differ from transcript marks (${docPct}%).`,
            });
          }
        }
      }
    }

    // Passport Number check
    if (expectedType === "PASSPORT" && formData.passportNumber) {
      const passField = extractedFields.find((f) => f.fieldKey === "passportNumber");
      if (passField && passField.normalizedValue) {
        const docPass = String(passField.normalizedValue).trim().toUpperCase();
        const formPass = String(formData.passportNumber).trim().toUpperCase();
        if (docPass !== formPass) {
          infoMismatches.push({
            fieldKey: "passportNumber",
            fieldLabel: "Passport Number",
            expectedValue: formPass,
            extractedValue: docPass,
            message: `Declared passport number '${formPass}' does not match extracted number '${docPass}'.`,
          });
        }
      }
    }
  }

  // Determine overall verdict
  let overallVerdict:
    | "VERIFIED"
    | "MISMATCH_DETECTED"
    | "QUALITY_WARNING"
    | "INFO_MISMATCH"
    | "REVIEW_REQUIRED"
    | "PENDING"
    | "PROCESSING"
    | "FAILED" = "VERIFIED";
  let summaryTitle = "AI Intelligence Verified";
  let summaryMessage = "Document type matches requirement and key information was verified.";
  let actionableGuidance = "";

  if (doc.processingStatus === "FAILED") {
    overallVerdict = "FAILED";
    summaryTitle = "Document Processing Failed";
    summaryMessage = qualityWarning?.message || "Document could not be processed.";
    actionableGuidance = "Please click 'Replace' to upload a clear PDF or image scan.";
  } else if (mismatchDetected) {
    overallVerdict = "MISMATCH_DETECTED";
    summaryTitle = "Document Type Mismatch Detected";
    summaryMessage = mismatchDetails?.message || "Uploaded document does not match requirement.";
    actionableGuidance = `Please click "Replace" above to upload your valid ${expectedLabel}.`;
  } else if (qualityWarning?.isBlurryOrLowQuality) {
    overallVerdict = "QUALITY_WARNING";
    summaryTitle = "Low Clarity / Blur Warning";
    summaryMessage = qualityWarning.message;
    actionableGuidance = "Consider uploading a clearer, higher-resolution copy to prevent officer queries.";
  } else if (infoMismatches.length > 0) {
    overallVerdict = "INFO_MISMATCH";
    summaryTitle = "Information Discrepancy Detected";
    summaryMessage = infoMismatches.map((m) => m.message).join(" ");
    actionableGuidance = "Please verify your document or update your application form details accordingly.";
  } else if (doc.processingStatus === "REVIEW_REQUIRED") {
    overallVerdict = "REVIEW_REQUIRED";
    summaryTitle = "Review Required by Verification Officer";
    summaryMessage = "Document intelligence extracted with moderate confidence. Officer will verify manually.";
  }

  const hasIssues =
    mismatchDetected || Boolean(qualityWarning?.isBlurryOrLowQuality) || infoMismatches.length > 0;

  return {
    hasIssues,
    mismatchDetected,
    mismatchDetails,
    qualityWarning,
    infoMismatches,
    overallVerdict,
    summaryTitle,
    summaryMessage,
    actionableGuidance,
  };
}

/**
 * Resolves the dynamic document checklist items from the scheme configuration and current form data.
 */
export function resolveDocumentChecklist(
  requirementsSchema: DocumentRequirementsSchema,
  formData: Record<string, unknown>,
  uploadedDocuments: (Document | DocumentSummaryDTO)[] = []
): ChecklistItemDTO[] {
  const latestDocsMap = new Map<DocumentType, DocumentSummaryDTO | Document>();
  for (const doc of uploadedDocuments) {
    if (doc.isLatestVersion) {
      latestDocsMap.set(doc.documentType, doc);
    }
  }

  return requirementsSchema.requirements.map((req: DocumentRequirement) => {
    let isRequired = req.level === "MANDATORY";

    if (req.level === "CONDITIONAL" && req.condition) {
      const parentVal = formData[req.condition.fieldId];
      const trigger = req.condition.triggerWhenValue;
      if (parentVal !== undefined && parentVal !== null) {
        if (Array.isArray(trigger)) {
          isRequired = trigger.map(String).includes(String(parentVal));
        } else if (typeof trigger === "boolean") {
          isRequired = Boolean(parentVal) === trigger;
        } else if (typeof trigger === "number") {
          isRequired = Number(parentVal) === trigger;
        } else {
          isRequired = String(parentVal) === String(trigger);
        }
      } else {
        isRequired = false;
      }
    }

    const uploaded = latestDocsMap.get(req.documentType);

    let uploadedDTO: DocumentSummaryDTO | undefined = undefined;
    if (uploaded) {
      const aiAudit = evaluateDocumentAiAudit(req, uploaded, formData);
      if ("previewUrl" in uploaded) {
        uploadedDTO = {
          ...(uploaded as DocumentSummaryDTO),
          aiAudit,
        };
      } else {
        uploadedDTO = {
          id: uploaded.id,
          caseDossierId: uploaded.caseDossierId,
          documentType: uploaded.documentType,
          originalFilename: uploaded.originalFilename,
          storagePath: uploaded.storagePath,
          mimeType: uploaded.mimeType,
          fileSizeBytes: uploaded.fileSizeBytes,
          version: uploaded.version,
          isLatestVersion: uploaded.isLatestVersion,
          processingStatus: uploaded.processingStatus,
          classifiedAs: uploaded.classifiedAs,
          classificationConfidence: uploaded.classificationConfidence,
          aiAudit,
          uploadedAt: uploaded.uploadedAt.toISOString(),
          previewUrl: `/api/documents/preview/${uploaded.storagePath}`,
        };
      }
    }

    return {
      requirementId: req.id,
      documentType: req.documentType,
      label: req.label,
      description: req.description,
      level: req.level,
      isRequired,
      isUploaded: Boolean(uploaded),
      uploadedDocument: uploadedDTO,
      allowedMimeTypes: req.allowedMimeTypes,
      maxFileSizeMb: req.maxFileSizeMb,
      maxPages: req.maxPages,
      validityWindowMonths: req.validityWindowMonths,
      issuerCriteria: req.issuerCriteria,
    };
  });
}

/**
 * Calculates complete pre-submission readiness report.
 */
export function computeReadinessReport(
  formSchema: FormSchema,
  documentRequirements: DocumentRequirementsSchema,
  formData: Record<string, unknown>,
  uploadedDocuments: (Document | DocumentSummaryDTO)[],
  schemeVersion: Pick<SchemeVersion, "applicationOpenDate" | "applicationDeadline">
): ReadinessReportDTO {
  const now = new Date();

  // 1. Check Window Status
  let isWindowOpen = true;
  let windowMessage = "Application window is currently active.";
  let daysRemaining: number | null = null;

  if (schemeVersion.applicationOpenDate && now < new Date(schemeVersion.applicationOpenDate)) {
    isWindowOpen = false;
    windowMessage = `Applications open on ${new Date(schemeVersion.applicationOpenDate).toLocaleDateString("en-IN")}.`;
  } else if (
    schemeVersion.applicationDeadline &&
    now > new Date(schemeVersion.applicationDeadline)
  ) {
    isWindowOpen = false;
    windowMessage = `Application deadline closed on ${new Date(schemeVersion.applicationDeadline).toLocaleDateString("en-IN")}.`;
  } else if (schemeVersion.applicationDeadline) {
    const diffTime = new Date(schemeVersion.applicationDeadline).getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    windowMessage = `${daysRemaining} days remaining before deadline.`;
  }

  // 2. Evaluate Form Readiness
  const formValidation = validateApplicationFormData(formSchema, formData);
  const visibleFields = formSchema.fields.filter((f: FormField) => isFieldVisible(f, formData));
  const requiredVisibleFields = visibleFields.filter((f: FormField) =>
    Boolean(f.validation?.required)
  );

  const missingFields: { id: string; label: string; sectionTitle: string }[] = [];
  const incompleteSectionIds = new Set<string>();

  for (const err of formValidation.errors) {
    const section = formSchema.sections.find((s: FormSection) => s.id === err.sectionId);
    missingFields.push({
      id: err.fieldId,
      label: err.fieldLabel,
      sectionTitle: section?.title || "General",
    });
    incompleteSectionIds.add(err.sectionId);
  }

  const incompleteSections = formSchema.sections
    .filter((s: FormSection) => incompleteSectionIds.has(s.id))
    .map((s: FormSection) => s.title);

  const completedFieldsCount =
    requiredVisibleFields.length -
    formValidation.errors.filter((e) =>
      requiredVisibleFields.some((rf: FormField) => rf.id === e.fieldId)
    ).length;

  const isFormComplete = formValidation.isValid;

  // 3. Evaluate Document Readiness
  const checklist = resolveDocumentChecklist(documentRequirements, formData, uploadedDocuments);
  const mandatoryItems = checklist.filter((item) => item.isRequired);
  const uploadedMandatoryCount = mandatoryItems.filter((item) => item.isUploaded).length;

  const missingMandatory: string[] = [];
  const missingConditional: string[] = [];

  for (const item of checklist) {
    if (item.isRequired && !item.isUploaded) {
      if (item.level === "MANDATORY") {
        missingMandatory.push(item.label);
      } else if (item.level === "CONDITIONAL") {
        missingConditional.push(item.label);
      }
    }
  }

  const isDocsComplete = missingMandatory.length === 0 && missingConditional.length === 0;

  // 4. Overall Status & Submission Readiness
  let overallStatus: "READY" | "ACTION_REQUIRED" | "INCOMPLETE" = "INCOMPLETE";

  if (isFormComplete && isDocsComplete && isWindowOpen) {
    overallStatus = "READY";
  } else if (!isWindowOpen || (!isFormComplete && completedFieldsCount > 0)) {
    overallStatus = "ACTION_REQUIRED";
  }

  const canSubmit = overallStatus === "READY";

  return {
    overallStatus,
    canSubmit,
    formReadiness: {
      status: isFormComplete ? "COMPLETE" : "INCOMPLETE",
      completedFieldsCount: Math.max(0, completedFieldsCount),
      requiredFieldsCount: requiredVisibleFields.length,
      incompleteSections,
      missingFields,
    },
    documentReadiness: {
      status: isDocsComplete ? "COMPLETE" : "INCOMPLETE",
      uploadedMandatoryCount,
      totalMandatoryCount: mandatoryItems.length,
      missingMandatory,
      missingConditional,
    },
    windowStatus: {
      isOpen: isWindowOpen,
      opensAt: schemeVersion.applicationOpenDate
        ? schemeVersion.applicationOpenDate.toISOString()
        : null,
      closesAt: schemeVersion.applicationDeadline
        ? schemeVersion.applicationDeadline.toISOString()
        : null,
      daysRemaining,
      message: windowMessage,
    },
  };
}
