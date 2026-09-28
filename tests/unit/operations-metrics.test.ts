import { describe, expect, it } from "vitest";
import { getPipelineAgeBucket } from "../../src/server/domain/operations/metrics";

describe("operations analytics age buckets", () => {
  it.each([
    [-1, "DAYS_0_TO_2"],
    [0, "DAYS_0_TO_2"],
    [2.999, "DAYS_0_TO_2"],
    [3, "DAYS_3_TO_7"],
    [7.999, "DAYS_3_TO_7"],
    [8, "DAYS_8_TO_14"],
    [14.999, "DAYS_8_TO_14"],
    [15, "DAYS_15_PLUS"],
  ] as const)("maps %s days to %s", (age, bucket) => {
    expect(getPipelineAgeBucket(age)).toBe(bucket);
  });
});
