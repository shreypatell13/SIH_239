import {
  PublishSchemeVersionDTO,
  ValidationResultDTO,
  ValidationErrorItem,
} from "../domain/scheme/types";
import { PublishSchemeVersionValidator } from "../domain/scheme/validators";

/**
 * Scheme Validation Service
 * Performs two-layer validation (Structural Zod + Semantic Business Rules)
 * Phase 2D: Scheme Studio & Declarative Configuration Engine
 */
export class SchemeValidationService {
  /**
   * Run comprehensive structural and semantic validation on a candidate SchemeVersion config.
   */
  validateVersionConfig(config: PublishSchemeVersionDTO): ValidationResultDTO {
    const errors: ValidationErrorItem[] = [];
    const warnings: ValidationErrorItem[] = [];

    // 1. Structural Zod Validation
    const zodResult = PublishSchemeVersionValidator.safeParse(config);
    if (!zodResult.success) {
      for (const issue of zodResult.error.issues) {
        const path = issue.path.join(".");
        const topSection = (issue.path[0] as ValidationErrorItem["section"]) || "general";
        errors.push({
          field: path,
          message: issue.message,
          section: [
            "formSchema",
            "documentRequirements",
            "eligibilityRules",
            "workflowConfig",
            "selectionConfig",
          ].includes(topSection)
            ? topSection
            : "general",
          severity: "ERROR",
        });
      }
    }

    const {
      formSchema,
      documentRequirements,
      eligibilityRules,
      workflowConfig,
      selectionConfig,
      applicationOpenDate,
      applicationDeadline,
    } = config;

    // If base schemas are missing/invalid, return early with structural errors
    if (!formSchema || !documentRequirements || !eligibilityRules) {
      return {
        isValid: false,
        errors,
        warnings,
        summary: {
          sectionsCount: formSchema?.sections?.length ?? 0,
          fieldsCount: formSchema?.fields?.length ?? 0,
          mandatoryDocsCount: 0,
          rulesCount: eligibilityRules?.rules?.length ?? 0,
          stagesCount: workflowConfig?.stages?.length ?? 0,
        },
      };
    }

    // 2. Semantic Form Schema Validation
    const sectionIds = new Set<string>();
    for (const section of formSchema.sections || []) {
      if (sectionIds.has(section.id)) {
        errors.push({
          field: `formSchema.sections.${section.id}`,
          message: `Duplicate section ID "${section.id}" detected in Form Schema.`,
          section: "formSchema",
          severity: "ERROR",
        });
      }
      sectionIds.add(section.id);
    }

    const fieldIds = new Set<string>();
    for (const field of formSchema.fields || []) {
      if (fieldIds.has(field.id)) {
        errors.push({
          field: `formSchema.fields.${field.id}`,
          message: `Duplicate field ID "${field.id}" detected in Form Schema.`,
          section: "formSchema",
          severity: "ERROR",
        });
      }
      fieldIds.add(field.id);

      if (!sectionIds.has(field.sectionId)) {
        errors.push({
          field: `formSchema.fields.${field.id}.sectionId`,
          message: `Field "${field.id}" references non-existent sectionId "${field.sectionId}".`,
          section: "formSchema",
          severity: "ERROR",
        });
      }

      if (field.conditionalVisibility) {
        const dep = field.conditionalVisibility.dependsOnField;
        if (!formSchema.fields.some((f) => f.id === dep)) {
          errors.push({
            field: `formSchema.fields.${field.id}.conditionalVisibility`,
            message: `Field "${field.id}" conditional visibility depends on non-existent field "${dep}".`,
            section: "formSchema",
            severity: "ERROR",
          });
        }
      }
    }

    // 3. Semantic Document Requirements Validation
    let mandatoryDocsCount = 0;
    const reqIds = new Set<string>();
    for (const req of documentRequirements.requirements || []) {
      if (reqIds.has(req.id)) {
        errors.push({
          field: `documentRequirements.requirements.${req.id}`,
          message: `Duplicate requirement ID "${req.id}" detected.`,
          section: "documentRequirements",
          severity: "ERROR",
        });
      }
      reqIds.add(req.id);

      if (req.level === "MANDATORY") {
        mandatoryDocsCount++;
      }

      if (req.level === "CONDITIONAL" && req.condition) {
        if (!fieldIds.has(req.condition.fieldId)) {
          errors.push({
            field: `documentRequirements.requirements.${req.id}.condition.fieldId`,
            message: `Conditional requirement "${req.id}" references non-existent form field "${req.condition.fieldId}".`,
            section: "documentRequirements",
            severity: "ERROR",
          });
        }
      }
    }

    if (mandatoryDocsCount === 0) {
      errors.push({
        field: "documentRequirements",
        message: "Document requirements matrix must contain at least one MANDATORY document.",
        section: "documentRequirements",
        severity: "ERROR",
      });
    }

    // 4. Semantic Eligibility Rules Validation
    const ruleKeys = new Set<string>();
    let hasStVerificationRule = false;
    for (const rule of eligibilityRules.rules || []) {
      if (ruleKeys.has(rule.ruleKey)) {
        errors.push({
          field: `eligibilityRules.rules.${rule.ruleKey}`,
          message: `Duplicate rule key "${rule.ruleKey}" detected.`,
          section: "eligibilityRules",
          severity: "ERROR",
        });
      }
      ruleKeys.add(rule.ruleKey);

      if (rule.ruleKey === "ST_VERIFICATION") {
        hasStVerificationRule = true;
      }

      if (rule.source === "FORM_DATA" && !fieldIds.has(rule.sourceField)) {
        errors.push({
          field: `eligibilityRules.rules.${rule.ruleKey}.sourceField`,
          message: `Rule "${rule.ruleKey}" references FORM_DATA field "${rule.sourceField}" which does not exist in Form Schema.`,
          section: "eligibilityRules",
          severity: "ERROR",
        });
      }
    }

    if (!hasStVerificationRule) {
      warnings.push({
        field: "eligibilityRules.ST_VERIFICATION",
        message:
          "Recommended ST_VERIFICATION rule is not configured for this tribal scholarship scheme.",
        section: "eligibilityRules",
        severity: "WARNING",
      });
    }

    // 5. Semantic Workflow Validation (if provided)
    if (workflowConfig && workflowConfig.stages) {
      const stageKeys = new Set<string>();
      for (const stage of workflowConfig.stages) {
        if (stageKeys.has(stage.stageKey)) {
          errors.push({
            field: `workflowConfig.stages.${stage.stageKey}`,
            message: `Duplicate workflow stage "${stage.stageKey}" detected.`,
            section: "workflowConfig",
            severity: "ERROR",
          });
        }
        stageKeys.add(stage.stageKey);
      }

      const hasStart = stageKeys.has("SUBMITTED") || stageKeys.has("DRAFT");
      const hasReview = stageKeys.has("OFFICER_REVIEW") || stageKeys.has("AUTOMATED_VERIFICATION");
      const hasTerminal = stageKeys.has("SANCTIONED") || stageKeys.has("REJECTED");

      if (!hasStart || !hasReview || !hasTerminal) {
        errors.push({
          field: "workflowConfig.stages",
          message:
            "Workflow must include at least an entry stage, a review stage, and a terminal stage.",
          section: "workflowConfig",
          severity: "ERROR",
        });
      }
    }

    // 6. Semantic Selection Validation (if provided)
    if (selectionConfig) {
      if (selectionConfig.maxAwardees <= 0) {
        errors.push({
          field: "selectionConfig.maxAwardees",
          message: "maxAwardees must be greater than zero.",
          section: "selectionConfig",
          severity: "ERROR",
        });
      }

      if (selectionConfig.quotas && selectionConfig.quotas.length > 0) {
        const totalPercentage = selectionConfig.quotas.reduce((sum, q) => sum + q.percentage, 0);
        if (totalPercentage > 100) {
          errors.push({
            field: "selectionConfig.quotas",
            message: `Total quota percentage (${totalPercentage}%) cannot exceed 100%.`,
            section: "selectionConfig",
            severity: "ERROR",
          });
        }
      }
    }

    // 7. Deadlines Check
    if (applicationOpenDate && applicationDeadline) {
      const open = new Date(applicationOpenDate);
      const close = new Date(applicationDeadline);
      if (!isNaN(open.getTime()) && !isNaN(close.getTime()) && close <= open) {
        errors.push({
          field: "applicationDeadline",
          message: "Application deadline must be strictly after the application open date.",
          section: "general",
          severity: "ERROR",
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        sectionsCount: formSchema.sections?.length ?? 0,
        fieldsCount: formSchema.fields?.length ?? 0,
        mandatoryDocsCount,
        rulesCount: eligibilityRules.rules?.length ?? 0,
        stagesCount: workflowConfig?.stages?.length ?? 0,
      },
    };
  }
}

export const schemeValidationService = new SchemeValidationService();
