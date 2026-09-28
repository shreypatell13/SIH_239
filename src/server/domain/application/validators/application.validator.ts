import { z } from "zod";
import { FormField, FormSchema } from "../../scheme/types";

export const CreateDraftValidator = z.object({
  schemeCode: z
    .string()
    .min(1, "Scheme code is required")
    .max(16, "Scheme code must be at most 16 characters")
    .regex(
      /^[A-Z0-9_-]+$/,
      "Scheme code must contain uppercase letters, numbers, hyphens or underscores"
    ),
});
export type CreateDraftInput = z.infer<typeof CreateDraftValidator>;

export const SaveDraftValidator = z.object({
  formData: z.record(z.unknown()),
});
export type SaveDraftInput = z.infer<typeof SaveDraftValidator>;

export const UpdateApplicantProfileValidator = z.object({
  dateOfBirth: z.string().nullable().optional(),
  gender: z.string().max(20).nullable().optional(),
  stateDomicile: z.string().max(100).nullable().optional(),
  district: z.string().max(100).nullable().optional(),
  mobile: z.string().max(20).nullable().optional(),
  aadhaarLast4: z
    .string()
    .regex(/^[0-9]{4}$/, "Aadhaar must be last 4 digits")
    .nullable()
    .optional(),
  academicQualification: z.string().max(150).nullable().optional(),
  institutionName: z.string().max(255).nullable().optional(),
  yearOfPassing: z.number().int().min(1950).max(2050).nullable().optional(),
  percentageObtained: z.number().min(0).max(100).nullable().optional(),
  annualFamilyIncome: z.number().min(0).nullable().optional(),
});
export type UpdateApplicantProfileInput = z.infer<typeof UpdateApplicantProfileValidator>;

/**
 * Checks whether a field is currently visible given the form data.
 */
export function isFieldVisible(field: FormField, formData: Record<string, unknown>): boolean {
  if (!field.conditionalVisibility) {
    return true;
  }
  const { dependsOnField, showWhenValue } = field.conditionalVisibility;
  const parentValue = formData[dependsOnField];

  if (parentValue === undefined || parentValue === null) {
    return false;
  }

  if (Array.isArray(showWhenValue)) {
    return showWhenValue.map(String).includes(String(parentValue));
  }

  if (typeof showWhenValue === "boolean") {
    return Boolean(parentValue) === showWhenValue;
  }

  if (typeof showWhenValue === "number") {
    return Number(parentValue) === showWhenValue;
  }

  return String(parentValue) === String(showWhenValue);
}

/**
 * Strips out values for fields that are currently hidden according to conditional visibility.
 */
export function sanitizeHiddenFieldValues(
  formSchema: FormSchema,
  rawFormData: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const field of formSchema.fields) {
    if (isFieldVisible(field, rawFormData)) {
      if (rawFormData[field.id] !== undefined) {
        sanitized[field.id] = rawFormData[field.id];
      }
    }
  }

  return sanitized;
}

export interface FormValidationError {
  fieldId: string;
  fieldLabel: string;
  sectionId: string;
  message: string;
}

/**
 * Server-authoritative two-pass validation for form data.
 */
export function validateApplicationFormData(
  formSchema: FormSchema,
  rawFormData: Record<string, unknown>
): {
  isValid: boolean;
  errors: FormValidationError[];
  sanitizedData: Record<string, unknown>;
} {
  const errors: FormValidationError[] = [];
  const sanitizedData = sanitizeHiddenFieldValues(formSchema, rawFormData);

  for (const field of formSchema.fields) {
    const isVisible = isFieldVisible(field, rawFormData);
    if (!isVisible) {
      continue; // Skip validation for hidden fields
    }

    const value = sanitizedData[field.id];
    const valRule = field.validation || {};
    const isRequired = Boolean(valRule.required);

    // 1. Required Check
    const isEmpty =
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0);

    if (isRequired && isEmpty) {
      errors.push({
        fieldId: field.id,
        fieldLabel: field.label,
        sectionId: field.sectionId,
        message: `${field.label} is required`,
      });
      continue;
    }

    if (isEmpty) {
      // If not required and empty, skip further value checks
      continue;
    }

    // 2. Type and constraint checks
    switch (field.type) {
      case "text":
      case "textarea": {
        if (typeof value !== "string") {
          errors.push({
            fieldId: field.id,
            fieldLabel: field.label,
            sectionId: field.sectionId,
            message: `${field.label} must be a string`,
          });
          break;
        }
        if (valRule.minLength !== undefined && value.length < valRule.minLength) {
          errors.push({
            fieldId: field.id,
            fieldLabel: field.label,
            sectionId: field.sectionId,
            message: `${field.label} must be at least ${valRule.minLength} characters`,
          });
        }
        if (valRule.maxLength !== undefined && value.length > valRule.maxLength) {
          errors.push({
            fieldId: field.id,
            fieldLabel: field.label,
            sectionId: field.sectionId,
            message: `${field.label} must not exceed ${valRule.maxLength} characters`,
          });
        }
        if (valRule.pattern) {
          try {
            const regex = new RegExp(valRule.pattern);
            if (!regex.test(value)) {
              errors.push({
                fieldId: field.id,
                fieldLabel: field.label,
                sectionId: field.sectionId,
                message: valRule.patternMessage || `${field.label} format is invalid`,
              });
            }
          } catch {
            // ignore malformed regex
          }
        }
        break;
      }

      case "email": {
        if (typeof value !== "string") {
          errors.push({
            fieldId: field.id,
            fieldLabel: field.label,
            sectionId: field.sectionId,
            message: `${field.label} must be a valid email string`,
          });
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push({
              fieldId: field.id,
              fieldLabel: field.label,
              sectionId: field.sectionId,
              message: `${field.label} must be a valid email address`,
            });
          }
        }
        break;
      }

      case "number": {
        const num = Number(value);
        if (isNaN(num)) {
          errors.push({
            fieldId: field.id,
            fieldLabel: field.label,
            sectionId: field.sectionId,
            message: `${field.label} must be a valid number`,
          });
          break;
        }
        if (valRule.min !== undefined && num < valRule.min) {
          errors.push({
            fieldId: field.id,
            fieldLabel: field.label,
            sectionId: field.sectionId,
            message: `${field.label} cannot be less than ${valRule.min}`,
          });
        }
        if (valRule.max !== undefined && num > valRule.max) {
          errors.push({
            fieldId: field.id,
            fieldLabel: field.label,
            sectionId: field.sectionId,
            message: `${field.label} cannot exceed ${valRule.max}`,
          });
        }
        break;
      }

      case "date": {
        const dateStr = String(value);
        const parsed = Date.parse(dateStr);
        if (isNaN(parsed)) {
          errors.push({
            fieldId: field.id,
            fieldLabel: field.label,
            sectionId: field.sectionId,
            message: `${field.label} must be a valid date`,
          });
        }
        break;
      }

      case "select": {
        const strVal = String(value);
        if (valRule.allowedValues && valRule.allowedValues.length > 0) {
          if (!valRule.allowedValues.includes(strVal)) {
            errors.push({
              fieldId: field.id,
              fieldLabel: field.label,
              sectionId: field.sectionId,
              message: `${field.label} selection is not in the allowed options`,
            });
          }
        }
        break;
      }

      case "multiselect": {
        if (!Array.isArray(value)) {
          errors.push({
            fieldId: field.id,
            fieldLabel: field.label,
            sectionId: field.sectionId,
            message: `${field.label} must be an array of selected options`,
          });
          break;
        }
        if (valRule.allowedValues && valRule.allowedValues.length > 0) {
          const invalidEntries = value.filter((v) => !valRule.allowedValues!.includes(String(v)));
          if (invalidEntries.length > 0) {
            errors.push({
              fieldId: field.id,
              fieldLabel: field.label,
              sectionId: field.sectionId,
              message: `${field.label} contains invalid options: ${invalidEntries.join(", ")}`,
            });
          }
        }
        break;
      }

      case "boolean": {
        if (typeof value !== "boolean" && value !== "true" && value !== "false") {
          errors.push({
            fieldId: field.id,
            fieldLabel: field.label,
            sectionId: field.sectionId,
            message: `${field.label} must be a boolean value`,
          });
        }
        break;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData,
  };
}
