import { NextRequest } from "next/server";
import { OcrBackgroundSweep } from "@/server/background/ocr-sweep";
import { apiError, apiSuccess } from "@/server/api-response";

export async function POST(req: NextRequest) {
  try {
    const sweepSecret = process.env.INTERNAL_SWEEP_SECRET;
    if (!sweepSecret) {
      return apiError("Internal sweep endpoint is not configured.", "SERVICE_UNAVAILABLE", 503);
    }
    const headerSecret = req.headers.get("x-internal-sweep-secret");

    if (!headerSecret || headerSecret !== sweepSecret) {
      return apiError("Unauthorized: Invalid internal sweep secret.", "UNAUTHORIZED", 401);
    }

    const body = await req.json().catch(() => ({}));
    const batchSize = typeof body?.batchSize === "number" ? body.batchSize : 5;

    const summary = await OcrBackgroundSweep.runSweep(batchSize);
    return apiSuccess(summary);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal sweep failed";
    return apiError(msg, "INTERNAL_ERROR", 500);
  }
}
