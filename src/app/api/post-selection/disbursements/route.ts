import { NextRequest } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { postSelectionService } from "@/server/services/post-selection.service";
import {
  DisbursementFilterQuerySchema,
  CreateDisbursementSchema,
} from "@/server/domain/post-selection/validators";
import { apiSuccess } from "@/server/api-response";
import { postSelectionApiError } from "@/server/api/post-selection-error";
import { postSelectionRepository } from "@/server/repositories/post-selection.repository";
import { assertPostSelectionManagementAccess } from "@/server/auth/post-selection-access";

export async function GET(request: NextRequest) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      throw new Error("Unauthorized: No active session.");
    }

    const { searchParams } = new URL(request.url);
    const rawParams = {
      scholarId: searchParams.get("scholarId") || undefined,
      schemeCode: searchParams.get("schemeCode") || undefined,
      status: searchParams.get("status") || undefined,
      financialYear: searchParams.get("financialYear") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    };

    const parsedFilter = DisbursementFilterQuerySchema.parse(rawParams);
    const result = await postSelectionService.listDisbursements(parsedFilter, user);

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

    assertPostSelectionManagementAccess(user);

    const body = await request.json();
    const parsed = CreateDisbursementSchema.parse(body);

    const created = await postSelectionRepository.createDisbursement({
      postSelectionRecord: {
        connect: { id: parsed.postSelectionRecordId },
      },
      installmentNumber: parsed.installmentNumber,
      financialYear: parsed.financialYear,
      amount: parsed.amount,
      scheduledDate: parsed.scheduledDate ? new Date(parsed.scheduledDate) : null,
      remarks: parsed.remarks,
    });

    return apiSuccess(created, 201);
  } catch (error) {
    return postSelectionApiError(error);
  }
}
