/**
 * Selection & Grant Configuration DSL Types
 * Phase 2D: Scheme Studio & Declarative Configuration Engine
 */

export type FinancialFrequency = "MONTHLY" | "ANNUAL" | "ONE_TIME";

export interface FinancialComponent {
  id: string;
  label: string; // e.g. "Monthly Fellowship Stipend", "Contingency Grant", "Tuition Fee"
  amountInr: number;
  frequency: FinancialFrequency;
  description?: string;
}

export interface QuotaItem {
  id: string;
  label: string; // e.g. "JRF Quota", "SRF Quota", "Female ST Candidate Reservation"
  percentage: number; // e.g. 30 (for 30%)
  seatsCount?: number;
}

export type MeritBasis = "ACADEMIC_SCORE" | "INCOME_INVERTED" | "COMPOSITE";

export interface SelectionConfig {
  version: "1.0";
  maxAwardees: number; // Maximum total sanctions for this scheme cycle
  quotas?: QuotaItem[];
  financialComponents: FinancialComponent[];
  meritBasis: MeritBasis;
  guidelinesNotes?: string;
}
