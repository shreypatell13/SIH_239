import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { deficiencyService } from "@/server/services/deficiency.service";

/**
 * PATCH /api/officer/deficiencies/[deficiencyId]
 * Allows an authorized officer to RESOLVE, WAIVE, or REOPEN a deficiency with mandatory remark.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ deficiencyId: string }> }
) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { deficiencyId } = await params;
    const body = await request.json();

    if (!body.action || !["RESOLVE", "WAIVE", "REOPEN"].includes(body.action)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action. Must be 'RESOLVE', 'WAIVE', or 'REOPEN'.",
        },
        { status: 400 }
      );
    }

    if (!body.remark || body.remark.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Officer resolution remark is mandatory.",
        },
        { status: 400 }
      );
    }

    const updated = await deficiencyService.officerResolveOrWaive(
      deficiencyId,
      {
        action: body.action,
        remark: body.remark.trim(),
      },
      user
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    const message = (error as Error).message;
    const status = message.includes("Forbidden")
      ? 403
      : message.includes("not found")
        ? 404
        : message.includes("Invalid status")
          ? 400
          : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
