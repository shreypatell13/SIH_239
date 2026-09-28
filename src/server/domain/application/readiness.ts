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

    const uploadedDTO: DocumentSummaryDTO | undefined = uploaded
      ? "previewUrl" in uploaded
        ? (uploaded as DocumentSummaryDTO)
        : {
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
            uploadedAt: uploaded.uploadedAt.toISOString(),
            previewUrl: `/api/documents/preview/${uploaded.storagePath}`,
          }
      : undefined;

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
