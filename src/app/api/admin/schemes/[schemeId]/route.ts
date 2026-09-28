import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { schemeService } from "@/server/services/scheme.service";

/**
 * GET /api/admin/schemes/[schemeId]
 * Get scheme details and all version histories
 */
export async function GET(_request: Request, { params }: { params: { schemeId: string } }) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { schemeId } = params;
    const scheme = await schemeService.getSchemeById(schemeId, user);

    if (!scheme) {
      return NextResponse.json({ success: false, error: "Scheme not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, scheme });
  } catch (error) {
    const message = (error as Error).message;
    const status = message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
