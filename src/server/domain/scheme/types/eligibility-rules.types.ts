/**
 * Eligibility Rule DSL Types
 * Phase 2D: Scheme Studio & Declarative Configuration Engine
 *
 * Grounding Rule: NO code execution from configuration.
 * Rules are declarative assertions evaluated by the deterministic rule engine.
 */

export type RuleOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "LESS_THAN"
  | "LESS_THAN_OR_EQUALS"
  | "GREATER_THAN"
  | "GREATER_THAN_OR_EQUALS"
  | "IN"
  | "NOT_IN"
  | "MATCHES_REGEX"
  | "IS_PRESENT"
  | "WITHIN_MONTHS";

export type RuleSource = "FORM_DATA" | "EXTRACTED_FIELD" | "COMPUTED";

export type RuleSeverity = "HARD_FAIL" | "SOFT_FLAG";

export interface StRelaxationConfig {
  /** Value added to the threshold for ST candidates (e.g. +5 years for age limit) */
  addToThreshold: number;
}

export interface EligibilityRule {
  ruleKey: string; // e.g. "ST_VERIFICATION", "INCOME_CEILING", "AGE_LIMIT", "ACADEMIC_MIN_SCORE"
  name: string; // Human readable title e.g. "ST Category Verification"
  description: string;
  source: RuleSource;
  sourceField: string; // Key in form data or extracted entity e.g. "annualFamilyIncome", "casteCategory"
  operator: RuleOperator;
  threshold: string | number | string[] | boolean; // Comparison value
  failureMessage: string; // Explainable message rendered in deficiency / findings
  severity: RuleSeverity;
  stRelaxation?: StRelaxationConfig;
  isActive: boolean;
}

export interface EligibilityRulesSchema {
  version: "1.0";
  rules: EligibilityRule[];
}
