import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { deficiencyService } from "@/server/services/deficiency.service";

/**
 * GET /api/applicant/applications/[id]/deficiencies/[deficiencyId]
 * Retrieves a single deficiency details for the applicant.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; deficiencyId: string }> }
) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id, deficiencyId } = await params;
    const deficiency = await deficiencyService.getApplicantDeficiency(id, deficiencyId, user);

    return NextResponse.json({
      success: true,
      data: deficiency,
    });
  } catch (error) {
    const message = (error as Error).message;
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
