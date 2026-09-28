import { NextRequest } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { operationsAnalyticsService } from "@/server/services/operations-analytics.service";
import { OperationsFilterQuerySchema } from "@/server/domain/operations/validators";
import { apiSuccess } from "@/server/api-response";
import { assertOperationsAccess } from "@/server/auth/operations-access";
import { operationsApiError } from "@/server/api/operations-error";

export async function GET(request: NextRequest) {
  try {
    const user = await getServerAuthUser();
    assertOperationsAccess(user);

    const { searchParams } = new URL(request.url);
    const rawParams = {
      schemeCode: searchParams.get("schemeCode") || undefined,
      schemeVersionId: searchParams.get("schemeVersionId") || undefined,
      stage: searchParams.get("stage") || undefined,
      state: searchParams.get("state") || undefined,
      fromDate: searchParams.get("fromDate") || undefined,
      toDate: searchParams.get("toDate") || undefined,
    };

    const parsedFilter = OperationsFilterQuerySchema.parse(rawParams);
    const result = await operationsAnalyticsService.getBottlenecks(parsedFilter);

    return apiSuccess(result);
  } catch (error) {
    return operationsApiError(error);
  }
}
