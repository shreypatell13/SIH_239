import { AgingBucket } from "./types";

/** Pipeline age uses UTC-backed creation timestamps and exact 24-hour days. */
export function getPipelineAgeBucket(ageDays: number): AgingBucket {
  const safeAge = Math.max(0, ageDays);
  if (safeAge < 3) return "DAYS_0_TO_2";
  if (safeAge < 8) return "DAYS_3_TO_7";
  if (safeAge < 15) return "DAYS_8_TO_14";
  return "DAYS_15_PLUS";
}
