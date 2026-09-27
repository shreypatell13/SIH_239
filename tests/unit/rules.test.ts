import { describe, it, expect } from "vitest";
import { ruleService } from "@/server/services/rule.service";

describe("Deterministic Rule Service Tests", () => {
  it("should approve NOS applicant who meets all criteria (ST category, <= 8L income, >= 60% marks)", async () => {
    const results = await ruleService.evaluateEligibility({
      applicantAgeYears: 28,
      annualFamilyIncomeInr: 450000,
      qualifyingPercentage: 68,
      isStCategoryConfirmed: true,
      schemeCode: "NOS",
    });

    expect(results).toHaveLength(3);
    expect(results.every((r) => r.isPassed)).toBe(true);
    expect(results.some((r) => r.isDeficiency)).toBe(false);
  });

  it("should flag deficiency when NOS applicant income exceeds 8 Lakhs ceiling", async () => {
    const results = await ruleService.evaluateEligibility({
      applicantAgeYears: 28,
      annualFamilyIncomeInr: 950000,
      qualifyingPercentage: 68,
      isStCategoryConfirmed: true,
      schemeCode: "NOS",
    });

    const incomeRule = results.find((r) => r.ruleCode === "RULE_NOS_INCOME_CEILING");
    expect(incomeRule).toBeDefined();
    expect(incomeRule?.isPassed).toBe(false);
    expect(incomeRule?.isDeficiency).toBe(true);
    expect(incomeRule?.explanation).toContain("exceeds the Rs. 8,00,000 limit");
  });

  it("should flag deficiency when ST category is not confirmed", async () => {
    const results = await ruleService.evaluateEligibility({
      applicantAgeYears: 25,
      qualifyingPercentage: 62,
      isStCategoryConfirmed: false,
      schemeCode: "NFST",
    });

    const stRule = results.find((r) => r.ruleCode === "RULE_ST_CATEGORY");
    expect(stRule?.isPassed).toBe(false);
    expect(stRule?.isDeficiency).toBe(true);
  });
});
