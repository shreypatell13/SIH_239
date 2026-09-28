import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { schemeService } from "@/server/services/scheme.service";

/**
 * GET /api/admin/schemes/[schemeId]/versions/[versionId]
 * Retrieve full read-only configuration of a specific SchemeVersion
 */
export async function GET(
  _request: Request,
  { params }: { params: { schemeId: string; versionId: string } }
) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { versionId } = params;
    const version = await schemeService.getVersionById(versionId, user);

    if (!version) {
      return NextResponse.json(
        { success: false, error: "Scheme version not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, version });
  } catch (error) {
    const message = (error as Error).message;
    const status = message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
