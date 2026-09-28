import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { applicationService } from "@/server/services/application.service";

export async function GET(_req: NextRequest, { params }: { params: { key: string[] } }) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const storagePath = params.key.join("/");
    const { buffer, mimeType } = await applicationService.getPreviewBuffer(storagePath, user);

    const headers = new Headers();
    headers.set("Content-Type", mimeType);
    headers.set("Content-Length", buffer.length.toString());
    headers.set("Cache-Control", "private, max-age=3600");

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Document preview failed";
    const status = message.includes("Forbidden") ? 403 : 404;
    return new NextResponse(status === 403 ? "Forbidden" : "Document not found", { status });
  }
}
