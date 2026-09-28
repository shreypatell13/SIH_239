import { NextRequest } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { officerService } from "@/server/services/officer.service";
import { OfficerQueueFilterSchema } from "@/server/domain/officer/validators";
import { UserRole } from "@prisma/client";
import { apiSuccess, apiError } from "@/server/api-response";

export async function GET(request: NextRequest) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return apiError("Unauthorized: Authentication required", "UNAUTHORIZED", 401);
    }

    if (user.role === UserRole.APPLICANT) {
      return apiError("Forbidden: Officer access required", "FORBIDDEN", 403);
    }

    const { searchParams } = new URL(request.url);
    const rawParams = {
      schemeCode: searchParams.get("schemeCode") || undefined,
      currentStage: searchParams.get("currentStage") || undefined,
      currentState: searchParams.get("currentState") || undefined,
      assessment: searchParams.get("assessment") || undefined,
      hasDeficiencies: searchParams.get("hasDeficiencies") || undefined,
      search: searchParams.get("search") || undefined,
      assignedToMe: searchParams.get("assignedToMe") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
    };

    const parsedFilters = OfficerQueueFilterSchema.parse(rawParams);
    const result = await officerService.listCaseQueue(parsedFilters, user);

    return apiSuccess(result);
  } catch (error) {
    const message = (error as Error).message;
    const isForbidden = message.includes("Forbidden");
    return apiError(message, isForbidden ? "FORBIDDEN" : "BAD_REQUEST", isForbidden ? 403 : 400);
  }
}
