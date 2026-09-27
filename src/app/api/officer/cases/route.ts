import { getServerAuthUser } from "@/server/auth/session";
import { apiSuccess, apiError } from "@/server/api-response";
import { hasRole } from "@/server/auth/roles";
import { CaseRepository } from "@/server/repositories/case.repository";

export async function GET() {
  const user = await getServerAuthUser();

  // 1. Check authentication presence
  if (!user) {
    return apiError(
      "Unauthorized: Active session required to access officer case queue.",
      "UNAUTHORIZED",
      401
    );
  }

  // 2. Check active account status
  if (user.isActive === false) {
    return apiError("Forbidden: Account is inactive or suspended.", "FORBIDDEN_INACTIVE", 403);
  }

  // 3. Server-authoritative role verification
  if (!hasRole(user, "VERIFICATION_OFFICER")) {
    return apiError(
      `Forbidden: VERIFICATION_OFFICER role required. Your role: ${user.role}`,
      "FORBIDDEN_ROLE",
      403
    );
  }

  // 4. Data scoping: Retrieve cases assigned to this officer (or pending triage)
  try {
    const caseRepo = new CaseRepository();
    const cases = await caseRepo.listAssignedCases(user.id);
    return apiSuccess({
      officerId: user.id,
      officerName: user.name,
      totalAssigned: cases.length,
      cases,
    });
  } catch (error) {
    return apiError(
      `Failed to retrieve cases: ${error instanceof Error ? error.message : "Database error"}`,
      "CASE_RETRIEVAL_ERROR",
      500
    );
  }
}
