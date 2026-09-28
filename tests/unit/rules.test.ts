import { describe, it, expect } from "vitest";
import { evaluateOperator } from "@/server/domain/eligibility/operators";

describe("Declarative rule operator evaluation", () => {
  it("uses the configured threshold rather than a scheme-specific constant", () => {
    const evaluateIncomeCeiling = (income: number, configuredThreshold: number) =>
      evaluateOperator({
        operator: "LESS_THAN_OR_EQUALS",
        resolvedValue: income,
        threshold: configuredThreshold,
        isCandidateSt: true,
        failureMessageTemplate: "Income exceeds configured ceiling.",
        referenceDate: new Date("2026-01-01"),
      });

    expect(evaluateIncomeCeiling(450000, 800000).outcome).toBe("PASS");
    expect(evaluateIncomeCeiling(950000, 800000).outcome).toBe("FAIL");
    expect(evaluateIncomeCeiling(950000, 1000000).outcome).toBe("PASS");
  });

  it("preserves deterministic pass and failure explanations", () => {
    const result = evaluateOperator({
      operator: "GREATER_THAN_OR_EQUALS",
      resolvedValue: 62,
      threshold: 60,
      isCandidateSt: false,
      failureMessageTemplate: "Score is below configured minimum.",
      referenceDate: new Date("2026-01-01"),
    });
    expect(result.outcome).toBe("PASS");
    expect(result.expectedValueString).toBe("60");
  });
});
