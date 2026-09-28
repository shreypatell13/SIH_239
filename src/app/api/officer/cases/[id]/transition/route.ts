import { getServerAuthUser } from "@/server/auth/session";
import { officerService } from "@/server/services/officer.service";
import { TransitionCaseStageSchema } from "@/server/domain/officer/validators";
import { UserRole } from "@prisma/client";
import { apiSuccess, apiError } from "@/server/api-response";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return apiError("Unauthorized: Authentication required", "UNAUTHORIZED", 401);
    }

    if (user.role === UserRole.APPLICANT) {
      return apiError("Forbidden: Officer access required", "FORBIDDEN", 403);
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = TransitionCaseStageSchema.parse(body);

    const updated = await officerService.transitionCaseStage(id, parsed, user);

    return apiSuccess(updated);
  } catch (error) {
    const message = (error as Error).message;
    const isForbidden = message.includes("Forbidden");
    const isNotFound = message.includes("not found");
    const isConflict = message.includes("Cannot advance");
    return apiError(
      message,
      isForbidden
        ? "FORBIDDEN"
        : isNotFound
          ? "NOT_FOUND"
          : isConflict
            ? "CONFLICT"
            : "BAD_REQUEST",
      isForbidden ? 403 : isNotFound ? 404 : isConflict ? 409 : 400
    );
  }
}
