import { AuthenticatedUser, assertActiveUser, hasPermission } from "./roles";

export interface CaseAccessRecord {
  id: string;
  officerAssignedId: string | null;
  application: { submittedById: string };
}

export type CaseAccessAction = "read" | "act" | "document-read";

export function canAccessCase(
  user: AuthenticatedUser | null | undefined,
  dossier: CaseAccessRecord,
  action: CaseAccessAction
): boolean {
  if (!user || user.isActive === false) return false;
  if (user.role === "APPLICANT") {
    return (
      action === "document-read" &&
      hasPermission(user, "document:read:own") &&
      dossier.application.submittedById === user.id
    );
  }
  if (action === "act") {
    if (user.role === "SCHEME_ADMIN") {
      return (
        hasPermission(user, "case:transition:officer_actions") &&
        hasPermission(user, "case:adjudicate")
      );
    }
    return (
      user.role === "VERIFICATION_OFFICER" &&
      hasPermission(user, "case:transition:officer_actions") &&
      (dossier.officerAssignedId === null || dossier.officerAssignedId === user.id)
    );
  }
  if (user.role === "VERIFICATION_OFFICER") {
    const permission = action === "document-read" ? "document:read:assigned" : "case:read:assigned";
    return (
      hasPermission(user, permission) &&
      (dossier.officerAssignedId === null || dossier.officerAssignedId === user.id)
    );
  }
  const permission = action === "document-read" ? "document:read:all" : "case:read:all";
  return hasPermission(user, permission);
}

export function canListCaseQueue(user: AuthenticatedUser | null | undefined): boolean {
  if (!user || user.isActive === false || user.role === "APPLICANT") return false;
  return hasPermission(user, "case:read:assigned") || hasPermission(user, "case:read:all");
}

export function assertCanAccessCase(
  user: AuthenticatedUser | null | undefined,
  dossier: CaseAccessRecord,
  action: CaseAccessAction
): asserts user is AuthenticatedUser {
  assertActiveUser(user);
  if (!canAccessCase(user, dossier, action)) {
    throw new Error("Forbidden: You are not authorized to access this case resource.");
  }
}
