import { NextRequest } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { applicationService } from "@/server/services/application.service";
import { apiError, apiSuccess } from "@/server/api-response";

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
    const application = await applicationService.getApplicationDetail(id, user);
    return apiSuccess(application);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch application";
    const status = msg.includes("Forbidden") ? 403 : msg.includes("not found") ? 404 : 500;
    return apiError(
      msg,
      status === 403 ? "FORBIDDEN" : status === 404 ? "NOT_FOUND" : "INTERNAL_ERROR",
      status
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return apiError("Unauthorized: Please log in as an applicant.", "UNAUTHORIZED", 401);
    }

    const { id } = await Promise.resolve(context.params);
    const body = await req.json();
    const { formData } = body;

    if (!formData || typeof formData !== "object") {
      return apiError("Valid formData object is required", "BAD_REQUEST", 400);
    }

    const saved = await applicationService.saveDraft(id, formData, user);
    return apiSuccess(saved);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to save application draft";
    const status = msg.includes("Forbidden") ? 403 : msg.includes("Only DRAFT") ? 409 : 400;
    return apiError(
      msg,
      status === 403 ? "FORBIDDEN" : status === 409 ? "CONFLICT" : "VALIDATION_ERROR",
      status
    );
  }
}
