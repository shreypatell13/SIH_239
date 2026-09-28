import { NextRequest } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { operationsAnalyticsService } from "@/server/services/operations-analytics.service";
import { DrillDownCasesQuerySchema } from "@/server/domain/operations/validators";
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
      agingBucket: searchParams.get("agingBucket") || undefined,
      deficiencyType: searchParams.get("deficiencyType") || undefined,
      documentType: searchParams.get("documentType") || undefined,
      unassignedOnly: searchParams.get("unassignedOnly") || undefined,
      blockedOnly: searchParams.get("blockedOnly") || undefined,
      assignedOfficerId: searchParams.get("assignedOfficerId") || undefined,
      hasOpenDeficienciesOnly: searchParams.get("hasOpenDeficienciesOnly") || undefined,
      officerAttentionOnly: searchParams.get("officerAttentionOnly") || undefined,
      completedOnly: searchParams.get("completedOnly") || undefined,
      underVerificationOnly: searchParams.get("underVerificationOnly") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    };

    const parsedQuery = DrillDownCasesQuerySchema.parse(rawParams);
    const result = await operationsAnalyticsService.getDrillDownCases(parsedQuery);

    return apiSuccess(result);
  } catch (error) {
    return operationsApiError(error);
  }
}
