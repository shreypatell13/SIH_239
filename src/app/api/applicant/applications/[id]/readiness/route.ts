import { NextRequest } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { applicationService } from "@/server/services/application.service";
import { apiError, apiSuccess } from "@/server/api-response";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return apiError("Unauthorized: Please log in as an applicant.", "UNAUTHORIZED", 401);
    }

    const readiness = await applicationService.getReadiness(params.id, user);
    return apiSuccess(readiness);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to calculate readiness";
    const status = msg.includes("Forbidden") ? 403 : msg.includes("not found") ? 404 : 500;
    return apiError(
      msg,
      status === 403 ? "FORBIDDEN" : status === 404 ? "NOT_FOUND" : "INTERNAL_ERROR",
      status
    );
  }
}
