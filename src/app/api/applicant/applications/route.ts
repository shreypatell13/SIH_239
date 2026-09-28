import { NextRequest } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { applicationService } from "@/server/services/application.service";
import { apiError, apiSuccess } from "@/server/api-response";

export async function GET() {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return apiError("Unauthorized: Please log in as an applicant.", "UNAUTHORIZED", 401);
    }

    const applications = await applicationService.listApplications(user);
    return apiSuccess(applications);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to list applications";
    const status = msg.includes("Forbidden") ? 403 : 500;
    return apiError(msg, status === 403 ? "FORBIDDEN" : "INTERNAL_ERROR", status);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return apiError("Unauthorized: Please log in as an applicant.", "UNAUTHORIZED", 401);
    }

    const body = await req.json();
    const { schemeCode } = body;

    if (!schemeCode || typeof schemeCode !== "string") {
      return apiError("Scheme code is required", "BAD_REQUEST", 400);
    }

    const draft = await applicationService.createDraft(schemeCode, user);
    return apiSuccess(draft, 201);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create application draft";
    let status = 500;
    let code = "INTERNAL_ERROR";

    if (msg.includes("Forbidden")) {
      status = 403;
      code = "FORBIDDEN";
    } else if (msg.includes("closed") || msg.includes("not open")) {
      status = 400;
      code = "WINDOW_CLOSED";
    } else if (msg.includes("already exists")) {
      status = 409;
      code = "CONFLICT";
    } else if (msg.includes("not found") || msg.includes("no active version")) {
      status = 404;
      code = "NOT_FOUND";
    }

    return apiError(msg, code, status);
  }
}
