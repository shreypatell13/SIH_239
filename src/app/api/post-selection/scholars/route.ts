import { NextRequest } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { postSelectionService } from "@/server/services/post-selection.service";
import {
  ScholarFilterQuerySchema,
  CreateScholarSchema,
} from "@/server/domain/post-selection/validators";
import { apiSuccess } from "@/server/api-response";
import { postSelectionApiError } from "@/server/api/post-selection-error";

export async function GET(request: NextRequest) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      throw new Error("Unauthorized: No active session.");
    }

    const { searchParams } = new URL(request.url);
    const rawParams = {
      search: searchParams.get("search") || undefined,
      schemeCode: searchParams.get("schemeCode") || undefined,
      scholarStatus: searchParams.get("scholarStatus") || undefined,
      disbursementStatus: searchParams.get("disbursementStatus") || undefined,
      fellowshipType: searchParams.get("fellowshipType") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    };

    const parsedFilter = ScholarFilterQuerySchema.parse(rawParams);
    const result = await postSelectionService.listScholars(parsedFilter, user);

    return apiSuccess(result);
  } catch (error) {
    return postSelectionApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      throw new Error("Unauthorized: No active session.");
    }

    const body = await request.json();
    const parsedData = CreateScholarSchema.parse(body);

    const scholar = await postSelectionService.enrollScholarFromCase(
      parsedData.caseDossierId,
      {
        awardedAmount: parsedData.awardedAmount,
        tenureStartDate: parsedData.tenureStartDate,
        tenureEndDate: parsedData.tenureEndDate,
        researchInstitution: parsedData.researchInstitution,
        supervisorName: parsedData.supervisorName,
        fellowshipType: parsedData.fellowshipType,
        totalTenureYears: parsedData.totalTenureYears,
        remarks: parsedData.remarks,
      },
      user
    );

    return apiSuccess(scholar, 201);
  } catch (error) {
    return postSelectionApiError(error);
  }
}
