import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { schemeService } from "@/server/services/scheme.service";

/**
 * POST /api/admin/schemes/validate
 * Pre-publish validation check for candidate SchemeVersion configuration
 */
export async function POST(request: Request) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = schemeService.validateConfig(body);

    return NextResponse.json({ success: true, validation: result });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
