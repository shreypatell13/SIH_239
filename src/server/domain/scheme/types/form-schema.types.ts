/**
 * Form Schema Declarative DSL Types
 * Phase 2D: Scheme Studio & Declarative Configuration Engine
 */

export type FieldType =
  "text" | "number" | "date" | "email" | "select" | "multiselect" | "textarea" | "boolean";

export interface ConditionalVisibility {
  /** The fieldId this condition depends on */
  dependsOnField: string;
  /** The value(s) that make this field visible */
  showWhenValue: string | string[] | boolean | number;
}

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number; // numeric / date threshold
  max?: number; // numeric / date threshold
  pattern?: string; // regex pattern string
  patternMessage?: string;
  allowedValues?: string[]; // enum choices for select/multiselect
}

export interface FormField {
  id: string; // unique camelCase key e.g. "annualFamilyIncome"
  label: string; // display label for UI
  type: FieldType;
  placeholder?: string;
  helpText?: string;
  validation: FieldValidation;
  conditionalVisibility?: ConditionalVisibility;
  sectionId: string; // refers to FormSection.id
  order: number; // display order within section
}

export interface FormSection {
  id: string; // e.g. "personal", "academic", "financial"
  title: string;
  description?: string;
  order: number;
}

export interface FormSchema {
  version: "1.0";
  sections: FormSection[];
  fields: FormField[];
}
