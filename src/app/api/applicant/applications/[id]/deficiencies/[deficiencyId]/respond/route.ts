import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { deficiencyService } from "@/server/services/deficiency.service";
import { applicationService } from "@/server/services/application.service";

/**
 * POST /api/applicant/applications/[id]/deficiencies/[deficiencyId]/respond
 * Allows applicant to submit a written clarification or attach a replacement document.
 * Automatically triggers targeted recheck.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; deficiencyId: string }> }
) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id, deficiencyId } = await params;
    let clarificationText: string | undefined;
    let resolvingDocumentId: string | undefined;
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      clarificationText = String(form.get("clarificationText") || "");
      const file = form.get("file");
      if (file instanceof File && file.size > 0) {
        const uploaded = await applicationService.uploadCorrectionDocument(
          id,
          deficiencyId,
          {
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            buffer: Buffer.from(await file.arrayBuffer()),
          },
          user
        );
        resolvingDocumentId = uploaded.id;
      }
    } else {
      const body = await request.json().catch(() => ({}));
      clarificationText = body.clarificationText;
      resolvingDocumentId = body.resolvingDocumentId;
    }
    const result = await deficiencyService.respondToDeficiency(
      id,
      deficiencyId,
      { clarificationText, resolvingDocumentId },
      user
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message = (error as Error).message;
    const status = message.includes("Forbidden")
      ? 403
      : message.includes("not found")
        ? 404
        : message.includes("Cannot respond") ||
            message.includes("Replacement") ||
            message.includes("required") ||
            message.includes("Invalid document")
          ? 400
          : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
