import { describe, it, expect } from "vitest";
import { cn, formatISODate } from "@/lib/utils";

describe("Utility Foundation Tests", () => {
  it("should merge tailwind class names properly", () => {
    const result = cn("px-2 py-1", "bg-red-500", { "text-white": true, "opacity-50": false });
    expect(result).toBe("px-2 py-1 bg-red-500 text-white");
  });

  it("should format dates into ISO string", () => {
    const date = new Date("2026-09-28T00:00:00.000Z");
    expect(formatISODate(date)).toBe("2026-09-28T00:00:00.000Z");
  });
});
