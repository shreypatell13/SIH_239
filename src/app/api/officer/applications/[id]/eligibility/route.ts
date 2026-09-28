import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { eligibilityEngineService } from "@/server/services/eligibility-engine.service";

/**
 * GET /api/officer/applications/[id]/eligibility
 * Retrieves the latest deterministic eligibility assessment and consistency breakdown.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await eligibilityEngineService.getEvaluationResults(id, user);

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Application not found or no evaluation exists" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message = (error as Error).message;
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
