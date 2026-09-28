import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { eligibilityEngineService } from "@/server/services/eligibility-engine.service";

/**
 * POST /api/officer/applications/[id]/evaluate
 * Triggers deterministic eligibility evaluation for the given application.
 * Pinned strictly to Application.schemeVersionId.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await eligibilityEngineService.evaluateApplication(id, user);

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
