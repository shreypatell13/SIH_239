import { getServerAuthUser } from "@/server/auth/session";
import { officerService } from "@/server/services/officer.service";
import { UserRole } from "@prisma/client";
import { apiSuccess, apiError } from "@/server/api-response";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return apiError("Unauthorized: Authentication required", "UNAUTHORIZED", 401);
    }

    if (user.role !== UserRole.VERIFICATION_OFFICER && user.role !== UserRole.SCHEME_ADMIN) {
      return apiError(
        "Forbidden: VERIFICATION_OFFICER role required to claim cases.",
        "FORBIDDEN",
        403
      );
    }

    const { id } = await params;
    const claimed = await officerService.claimCase(id, user);

    return apiSuccess(claimed);
  } catch (error) {
    const message = (error as Error).message;
    const isForbidden = message.includes("Forbidden");
    const isNotFound = message.includes("not found");
    return apiError(
      message,
      isForbidden ? "FORBIDDEN" : isNotFound ? "NOT_FOUND" : "BAD_REQUEST",
      isForbidden ? 403 : isNotFound ? 404 : 400
    );
  }
}
