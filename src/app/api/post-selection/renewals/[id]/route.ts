import { NextRequest } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { postSelectionService } from "@/server/services/post-selection.service";
import {
  SubmitRenewalSchema,
  ReviewRenewalSchema,
} from "@/server/domain/post-selection/validators";
import { apiSuccess } from "@/server/api-response";
import { postSelectionApiError } from "@/server/api/post-selection-error";
import { isOfficerOrManagement } from "@/server/auth/post-selection-access";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      throw new Error("Unauthorized: No active session.");
    }

    const body = await request.json();

    // Check if this is an officer review action or applicant submission action
    if (body.action && isOfficerOrManagement(user.role)) {
      const parsedReview = ReviewRenewalSchema.parse(body);
      const result = await postSelectionService.reviewRenewal(params.id, parsedReview, user);
      return apiSuccess(result);
    } else {
      const parsedSubmit = SubmitRenewalSchema.parse(body);
      const result = await postSelectionService.submitRenewal(params.id, parsedSubmit, user);
      return apiSuccess(result);
    }
  } catch (error) {
    return postSelectionApiError(error);
  }
}
