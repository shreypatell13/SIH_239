export interface RuleInput {
  applicantAgeYears: number;
  annualFamilyIncomeInr?: number;
  qualifyingPercentage: number;
  isStCategoryConfirmed: boolean;
  schemeCode: "NFST" | "NOS";
}

export interface RuleEvaluationResult {
  ruleCode: string;
  ruleTitle: string;
  isPassed: boolean;
  explanation: string;
  isDeficiency: boolean;
}

export interface IRuleService {
  evaluateEligibility(input: RuleInput): Promise<RuleEvaluationResult[]>;
}

export class RuleService implements IRuleService {
  async evaluateEligibility(input: RuleInput): Promise<RuleEvaluationResult[]> {
    const results: RuleEvaluationResult[] = [];

    // Rule 1: ST Category
    results.push({
      ruleCode: "RULE_ST_CATEGORY",
      ruleTitle: "Scheduled Tribe Category Verification",
      isPassed: input.isStCategoryConfirmed,
      explanation: input.isStCategoryConfirmed
        ? "Valid Scheduled Tribe certificate confirmed."
        : "Scheduled Tribe certificate is missing or unverified.",
      isDeficiency: !input.isStCategoryConfirmed,
    });

    // Rule 2: Income Ceiling (NOS specific: <= 8.00 Lakhs)
    if (input.schemeCode === "NOS") {
      const income = input.annualFamilyIncomeInr ?? Infinity;
      const passed = income <= 800000;
      results.push({
        ruleCode: "RULE_NOS_INCOME_CEILING",
        ruleTitle: "Annual Family Income Ceiling (<= Rs. 8,00,000)",
        isPassed: passed,
        explanation: passed
          ? `Annual family income of Rs. ${income.toLocaleString("en-IN")} is within the ceiling.`
          : `Annual family income of Rs. ${income.toLocaleString("en-IN")} exceeds the Rs. 8,00,000 limit.`,
        isDeficiency: !passed,
      });
    }

    // Rule 3: Academic Minimum Percentage (NOS: >= 60%, NFST: >= 55%)
    const minMarks = input.schemeCode === "NOS" ? 60 : 55;
    const marksPassed = input.qualifyingPercentage >= minMarks;
    results.push({
      ruleCode: "RULE_ACADEMIC_PERCENTAGE",
      ruleTitle: `Qualifying Degree Percentage (>= ${minMarks}%)`,
      isPassed: marksPassed,
      explanation: marksPassed
        ? `Qualifying academic score of ${input.qualifyingPercentage}% satisfies minimum criteria (${minMarks}%).`
        : `Qualifying academic score of ${input.qualifyingPercentage}% is below the required ${minMarks}%.`,
      isDeficiency: !marksPassed,
    });

    return results;
  }
}

export const ruleService = new RuleService();
