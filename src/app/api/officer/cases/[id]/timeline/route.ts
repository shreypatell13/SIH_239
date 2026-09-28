import { getServerAuthUser } from "@/server/auth/session";
import { officerService } from "@/server/services/officer.service";
import { UserRole } from "@prisma/client";
import { apiSuccess, apiError } from "@/server/api-response";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return apiError("Unauthorized: Authentication required", "UNAUTHORIZED", 401);
    }

    if (user.role === UserRole.APPLICANT) {
      return apiError("Forbidden: Officer access required", "FORBIDDEN", 403);
    }

    const { id } = await params;
    const detail = await officerService.getCaseWorkspaceDetail(id, user);

    return apiSuccess({ timeline: detail.timeline });
  } catch (error) {
    const message = (error as Error).message;
    const isForbidden = message.includes("Forbidden");
    const isNotFound = message.includes("not found");
    return apiError(
      message,
      isForbidden ? "FORBIDDEN" : isNotFound ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
      isForbidden ? 403 : isNotFound ? 404 : 500
    );
  }
}
