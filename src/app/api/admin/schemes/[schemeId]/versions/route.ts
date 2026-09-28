import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { schemeService } from "@/server/services/scheme.service";

/**
 * POST /api/admin/schemes/[schemeId]/versions
 * Publish a new version for a scheme (SCHEME_ADMIN only)
 */
export async function POST(request: Request, { params }: { params: { schemeId: string } }) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { schemeId } = params;
    const body = await request.json();

    const published = await schemeService.publishVersion(schemeId, body, user);
    return NextResponse.json({ success: true, version: published }, { status: 201 });
  } catch (error) {
    const message = (error as Error).message;
    let status = 400;
    if (message.includes("Forbidden")) status = 403;
    else if (message.includes("Validation failed")) status = 422;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
