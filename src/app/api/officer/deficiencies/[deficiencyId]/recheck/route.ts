import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { deficiencyService } from "@/server/services/deficiency.service";
import { UserRole } from "@prisma/client";

/**
 * POST /api/officer/deficiencies/[deficiencyId]/recheck
 * Manually triggers targeted recheck pipeline for a deficiency.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ deficiencyId: string }> }
) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === UserRole.APPLICANT) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Officer access required" },
        { status: 403 }
      );
    }

    const { deficiencyId } = await params;
    const result = await deficiencyService.executeTargetedRecheck(deficiencyId, user);

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
