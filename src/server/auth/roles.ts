import { z } from "zod";

export const UserRoleSchema = z.enum([
  "APPLICANT",
  "VERIFICATION_OFFICER",
  "SCHEME_ADMIN",
  "OPERATIONS_DIRECTOR",
]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isDemoSession?: boolean;
}

// Permission matrix
export const ROLE_PERMISSIONS: Record<UserRole, readonly string[]> = {
  APPLICANT: [
    "application:create",
    "application:read:own",
    "application:update:own",
    "document:upload:own",
    "deficiency:resolve:own",
  ],
  VERIFICATION_OFFICER: [
    "application:read:assigned",
    "application:verify",
    "document:read:assigned",
    "evidence:inspect",
    "deficiency:issue",
    "case:adjudicate",
  ],
  SCHEME_ADMIN: [
    "scheme:create",
    "scheme:update",
    "scheme:version",
    "rule:configure",
    "workflow:configure",
    "system:manage",
  ],
  OPERATIONS_DIRECTOR: [
    "analytics:read:all",
    "control_tower:view",
    "backlog:inspect",
    "sla:monitor",
    "reports:export",
  ],
} as const;

/**
 * Server-authoritative role check.
 * Strictly verifies whether an authenticated user holds the required role.
 */
export function hasRole(
  user: AuthenticatedUser | null | undefined,
  requiredRole: UserRole
): boolean {
  if (!user || !user.role) return false;
  return user.role === requiredRole;
}

/**
 * Server-authoritative permission check.
 */
export function hasPermission(
  user: AuthenticatedUser | null | undefined,
  requiredPermission: string
): boolean {
  if (!user || !user.role) return false;
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(requiredPermission);
}

/**
 * Guard function that throws an unauthorized error if check fails.
 */
export function assertAuthorized(
  user: AuthenticatedUser | null | undefined,
  requiredRole: UserRole,
  resourceName?: string
): asserts user is AuthenticatedUser {
  if (!user) {
    throw new Error(`Unauthorized: No active authentication session.`);
  }
  if (user.role !== requiredRole) {
    throw new Error(
      `Forbidden: Server-side RBAC rejected access to ${resourceName ?? "resource"}. Required role: ${requiredRole}, provided role: ${user.role}.`
    );
  }
}
