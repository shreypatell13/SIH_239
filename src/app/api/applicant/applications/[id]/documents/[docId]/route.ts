import { NextRequest } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { applicationService } from "@/server/services/application.service";
import { apiError, apiSuccess } from "@/server/api-response";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return apiError("Unauthorized: Please log in as an applicant.", "UNAUTHORIZED", 401);
    }

    const success = await applicationService.deleteDocument(params.id, params.docId, user);
    if (!success) {
      return apiError("Document not found or could not be removed.", "NOT_FOUND", 404);
    }

    return apiSuccess({ deleted: true, documentId: params.docId });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete document";
    const status = msg.includes("Forbidden") ? 403 : msg.includes("Only DRAFT") ? 409 : 400;
    return apiError(
      msg,
      status === 403 ? "FORBIDDEN" : status === 409 ? "CONFLICT" : "DELETE_ERROR",
      status
    );
  }
}
