import { NextRequest } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { documentProcessingService } from "@/server/services/document-processing.service";
import { apiError, apiSuccess } from "@/server/api-response";
import { DocumentType } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: { docId: string } }) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return apiError(
        "Unauthorized: Please log in as a verification officer.",
        "UNAUTHORIZED",
        401
      );
    }

    const body = await req.json().catch(() => ({}));
    const correctedType = body?.correctedType as DocumentType;

    if (!correctedType || !Object.values(DocumentType).includes(correctedType)) {
      return apiError(
        `Invalid or missing 'correctedType'. Must be one of: ${Object.values(DocumentType).join(", ")}`,
        "BAD_REQUEST",
        400
      );
    }

    const updated = await documentProcessingService.correctClassification(
      params.docId,
      correctedType,
      user
    );

    return apiSuccess(updated);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to correct document classification";
    const status = msg.includes("Forbidden") ? 403 : msg.includes("not found") ? 404 : 500;
    return apiError(
      msg,
      status === 403 ? "FORBIDDEN" : status === 404 ? "NOT_FOUND" : "INTERNAL_ERROR",
      status
    );
  }
}
