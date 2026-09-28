import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { deficiencyService } from "@/server/services/deficiency.service";

/**
 * GET /api/applicant/applications/[id]/deficiencies
 * Lists all deficiencies and summary for the applicant's application.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const deficiencies = await deficiencyService.listApplicantDeficiencies(id, user);
    const summary = await deficiencyService.getDeficiencySummary(id, user);

    return NextResponse.json({
      success: true,
      data: {
        deficiencies,
        summary,
      },
    });
  } catch (error) {
    const message = (error as Error).message;
    const status = message.includes("Forbidden") ? 403 : message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
