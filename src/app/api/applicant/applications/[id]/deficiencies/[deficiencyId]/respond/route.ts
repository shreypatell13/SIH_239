import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { deficiencyService } from "@/server/services/deficiency.service";

/**
 * POST /api/applicant/applications/[id]/deficiencies/[deficiencyId]/respond
 * Allows applicant to submit a written clarification or attach a replacement document.
 * Automatically triggers targeted recheck.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; deficiencyId: string }> }
) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id, deficiencyId } = await params;
    const body = await request.json().catch(() => ({}));

    const result = await deficiencyService.respondToDeficiency(
      id,
      deficiencyId,
      {
        clarificationText: body.clarificationText,
        resolvingDocumentId: body.resolvingDocumentId,
      },
      user
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message = (error as Error).message;
    const status = message.includes("Forbidden")
      ? 403
      : message.includes("not found")
        ? 404
        : message.includes("Cannot respond")
          ? 400
          : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
