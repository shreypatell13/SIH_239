import { UserRole } from "@prisma/client";
import { assertActiveUser, AuthenticatedUser } from "./roles";

export function assertPostSelectionAccess(user: AuthenticatedUser | null | undefined): void {
  assertActiveUser(user);
  // All authenticated users can access post-selection, but queries will be scoped based on role
}

export function isOfficerOrManagement(role: UserRole): boolean {
  return (
    role === UserRole.VERIFICATION_OFFICER ||
    role === UserRole.SCHEME_ADMIN ||
    role === UserRole.OPERATIONS_DIRECTOR
  );
}

export function assertPostSelectionManagementAccess(
  user: AuthenticatedUser | null | undefined
): void {
  assertActiveUser(user);
  if (!isOfficerOrManagement(user.role)) {
    throw new Error(
      "Forbidden: Officer or Management privileges required for this post-selection action."
    );
  }
}

export function assertScholarAccess(
  user: AuthenticatedUser | null | undefined,
  scholarApplicantUserId: string
): void {
  assertActiveUser(user);
  if (isOfficerOrManagement(user.role)) {
    return;
  }
  if (user.role === UserRole.APPLICANT && user.id === scholarApplicantUserId) {
    return;
  }
  throw new Error("Forbidden: Access denied to this scholar record.");
}
