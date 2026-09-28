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

    const profile = await applicationService.getApplicantProfile(user);
    return apiSuccess(profile);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch profile";
    const status = msg.includes("Forbidden") ? 403 : 500;
    return apiError(msg, status === 403 ? "FORBIDDEN" : "INTERNAL_ERROR", status);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return apiError("Unauthorized: Please log in as an applicant.", "UNAUTHORIZED", 401);
    }

    const body = await req.json();
    const updated = await applicationService.updateApplicantProfile(body, user);
    return apiSuccess(updated);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update profile";
    const status = msg.includes("Forbidden") ? 403 : 400;
    return apiError(msg, status === 403 ? "FORBIDDEN" : "VALIDATION_ERROR", status);
  }
}
