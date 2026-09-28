import { NextRequest } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { documentProcessingService } from "@/server/services/document-processing.service";
import { apiError, apiSuccess } from "@/server/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return apiError("Unauthorized: Please log in as an applicant.", "UNAUTHORIZED", 401);
    }

    const extraction = await documentProcessingService.getApplicantDocumentExtraction(
      params.docId,
      user
    );
    return apiSuccess(extraction);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch document extraction";
    const status = msg.includes("Forbidden") ? 403 : msg.includes("not found") ? 404 : 500;
    return apiError(
      msg,
      status === 403 ? "FORBIDDEN" : status === 404 ? "NOT_FOUND" : "INTERNAL_ERROR",
      status
    );
  }
}
