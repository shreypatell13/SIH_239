import { NextRequest } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { applicationService } from "@/server/services/application.service";
import { apiError, apiSuccess } from "@/server/api-response";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return apiError("Unauthorized: Please log in as an applicant.", "UNAUTHORIZED", 401);
    }

    const status = await applicationService.submitApplication(params.id, user);
    return apiSuccess(status);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to submit application";
    let status = 400;
    let code = "SUBMISSION_ERROR";

    if (msg.includes("Forbidden")) {
      status = 403;
      code = "FORBIDDEN";
    } else if (msg.includes("already in") || msg.includes("already submitted")) {
      status = 409;
      code = "CONFLICT";
    } else if (msg.includes("closed") || msg.includes("deadline")) {
      status = 400;
      code = "DEADLINE_PASSED";
    } else if (msg.includes("validation failed") || msg.includes("missing")) {
      status = 400;
      code = "READINESS_INCOMPLETE";
    } else if (msg.includes("not found")) {
      status = 404;
      code = "NOT_FOUND";
    }

    return apiError(msg, code, status);
  }
}
