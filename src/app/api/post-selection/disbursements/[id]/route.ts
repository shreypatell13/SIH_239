import { NextRequest } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { postSelectionService } from "@/server/services/post-selection.service";
import { UpdateDisbursementSchema } from "@/server/domain/post-selection/validators";
import { apiSuccess } from "@/server/api-response";
import { postSelectionApiError } from "@/server/api/post-selection-error";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      throw new Error("Unauthorized: No active session.");
    }

    const body = await request.json();
    const parsed = UpdateDisbursementSchema.parse(body);

    const result = await postSelectionService.updateDisbursementStatus(params.id, parsed, user);

    return apiSuccess(result);
  } catch (error) {
    return postSelectionApiError(error);
  }
}
