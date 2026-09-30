import { NextRequest } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { applicationService } from "@/server/services/application.service";
import { apiError, apiSuccess } from "@/server/api-response";
import { DocumentType } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return apiError("Unauthorized: Please log in as an applicant.", "UNAUTHORIZED", 401);
    }

    const { id } = await Promise.resolve(context.params);
    const checklist = await applicationService.getChecklist(id, user);
    return apiSuccess(checklist);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch document checklist";
    const status = msg.includes("Forbidden") ? 403 : msg.includes("not found") ? 404 : 500;
    return apiError(
      msg,
      status === 403 ? "FORBIDDEN" : status === 404 ? "NOT_FOUND" : "INTERNAL_ERROR",
      status
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return apiError("Unauthorized: Please log in as an applicant.", "UNAUTHORIZED", 401);
    }

    const { id } = await Promise.resolve(context.params);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const docTypeStr = formData.get("documentType") as string | null;

    if (!file || !docTypeStr) {
      return apiError(
        "Both 'file' and 'documentType' form fields are required.",
        "BAD_REQUEST",
        400
      );
    }

    const documentType = docTypeStr as DocumentType;
    if (!Object.values(DocumentType).includes(documentType)) {
      return apiError(`Invalid documentType "${docTypeStr}".`, "BAD_REQUEST", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploaded = await applicationService.uploadDocument(
      id,
      documentType,
      {
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        buffer,
      },
      user
    );

    return apiSuccess(uploaded, 201);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to upload document";
    let status = 400;
    let code = "UPLOAD_ERROR";

    if (msg.includes("Forbidden")) {
      status = 403;
      code = "FORBIDDEN";
    } else if (msg.includes("not found")) {
      status = 404;
      code = "NOT_FOUND";
    } else if (msg.includes("Only DRAFT")) {
      status = 409;
      code = "CONFLICT";
    }

    return apiError(msg, code, status);
  }
}
