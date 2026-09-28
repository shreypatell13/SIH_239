import { NextRequest } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { applicationService } from "@/server/services/application.service";
import { apiError, apiSuccess } from "@/server/api-response";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return apiError("Unauthorized: Please log in as an applicant.", "UNAUTHORIZED", 401);
    }

    let reason: string | undefined;
    try {
      const body = await req.json();
      reason = body.reason;
    } catch {
      // Empty body is acceptable
    }

    const status = await applicationService.withdrawApplication(params.id, user, reason);
    return apiSuccess(status);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to withdraw application";
    const status = msg.includes("Forbidden")
      ? 403
      : msg.includes("not permitted") || msg.includes("already")
        ? 409
        : 400;
    return apiError(
      msg,
      status === 403 ? "FORBIDDEN" : status === 409 ? "CONFLICT" : "WITHDRAWAL_ERROR",
      status
    );
  }
}
