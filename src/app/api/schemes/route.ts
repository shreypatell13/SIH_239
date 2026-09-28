import { NextResponse } from "next/server";
import { schemeService } from "@/server/services/scheme.service";

/**
 * GET /api/schemes
 * Public endpoint: Returns active scholarship schemes summary for applicants
 */
export async function GET() {
  try {
    const schemes = await schemeService.listActiveSchemes();
    return NextResponse.json({ success: true, schemes });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
