import { NextRequest } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { postSelectionService } from "@/server/services/post-selection.service";
import { apiSuccess } from "@/server/api-response";
import { postSelectionApiError } from "@/server/api/post-selection-error";

export async function GET(request: NextRequest) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      throw new Error("Unauthorized: No active session.");
    }

    const result = await postSelectionService.getOverview(user);

    return apiSuccess(result);
  } catch (error) {
    return postSelectionApiError(error);
  }
}
