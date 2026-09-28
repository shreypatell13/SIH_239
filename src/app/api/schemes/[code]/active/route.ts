import { NextResponse } from "next/server";
import { schemeService } from "@/server/services/scheme.service";

/**
 * GET /api/schemes/[code]/active
 * Returns current active SchemeVersion for dynamic application rendering
 */
export async function GET(_request: Request, { params }: { params: { code: string } }) {
  try {
    const { code } = params;
    const version = await schemeService.getActiveVersionByCode(code.toUpperCase());

    if (!version) {
      return NextResponse.json(
        { success: false, error: `No active version found for scheme "${code}"` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, version });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
