import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { schemeService } from "@/server/services/scheme.service";

/**
 * GET /api/admin/schemes - List all schemes (Admin / Management)
 * POST /api/admin/schemes - Create new scheme (SCHEME_ADMIN only)
 */
export async function GET() {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const schemes = await schemeService.listAllSchemes(user);
    return NextResponse.json({ success: true, schemes });
  } catch (error) {
    const message = (error as Error).message;
    const status = message.includes("Forbidden") ? 403 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const created = await schemeService.createScheme(body, user);
    return NextResponse.json({ success: true, scheme: created }, { status: 201 });
  } catch (error) {
    const message = (error as Error).message;
    const status = message.includes("Forbidden") ? 403 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
