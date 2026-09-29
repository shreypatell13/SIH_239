import { NextRequest } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { postSelectionService } from "@/server/services/post-selection.service";
import { apiSuccess } from "@/server/api-response";
import { postSelectionApiError } from "@/server/api/post-selection-error";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      throw new Error("Unauthorized: No active session.");
    }

    const scholar = await postSelectionService.getScholarDetail(params.id, user);

    return apiSuccess(scholar);
  } catch (error) {
    return postSelectionApiError(error);
  }
}
