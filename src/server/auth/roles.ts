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
  isActive?: boolean;
  isDemoSession?: boolean;
}

/**
 * Authoritative role-permission matrix.
 * Note: OPERATIONS_DIRECTOR has strictly read-only and monitoring permissions.
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly string[]> = {
  APPLICANT: [
    "application:create",
    "application:read:own",
    "application:update:own",
    "application:submit:own",
    "application:withdraw:own",
    "document:upload:own",
    "document:read:own",
    "deficiency:read:own",
    "deficiency:resolve:own",
    "profile:read:own",
    "profile:update:own",
  ],
  VERIFICATION_OFFICER: [
    "application:read:assigned",
    "application:verify",
    "document:read:assigned",
    "document:annotate:assigned",
    "evidence:inspect",
    "deficiency:issue",
    "deficiency:read:assigned",
    "case:adjudicate",
    "case:read:assigned",
    "case:transition:officer_actions",
    "audit:read:assigned",
    "scheme:read",
  ],
  SCHEME_ADMIN: [
    "scheme:create",
    "scheme:update",
    "scheme:read",
    "scheme:read:all",
    "scheme:version",
    "rule:configure",
    "workflow:configure",
    "system:manage",
    "user:manage",
    "application:read:all",
    "case:read:all",
    "document:read:all",
    "case:transition:officer_actions",
    "case:adjudicate",
    "deficiency:issue",
    "deficiency:resolve:assigned",
    "audit:read:all",
  ],
  OPERATIONS_DIRECTOR: [
    "analytics:read:all",
    "control_tower:view",
    "backlog:inspect",
    "sla:monitor",
    "reports:export",
    "application:read:all",
    "case:read:all",
    "audit:read:all",
    "officer:workload:view",
    "scheme:read",
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
 * Guard function that verifies active user status.
 * Rejects deactivated or missing accounts.
 */
export function assertActiveUser(
  user: AuthenticatedUser | null | undefined
): asserts user is AuthenticatedUser {
  if (!user) {
    throw new Error("Unauthorized: No active authentication session.");
  }
  if (user.isActive === false) {
    throw new Error("Forbidden: User account is inactive or suspended.");
  }
}

/**
 * Guard function that throws an unauthorized / forbidden error if role check fails.
 */
export function assertAuthorized(
  user: AuthenticatedUser | null | undefined,
  requiredRole: UserRole,
  resourceName?: string
): asserts user is AuthenticatedUser {
  assertActiveUser(user);
  if (user.role !== requiredRole) {
    throw new Error(
      `Forbidden: Server-side RBAC rejected access to ${resourceName ?? "resource"}. Required role: ${requiredRole}, provided role: ${user.role}.`
    );
  }
}

/**
 * Guard function that throws an unauthorized / forbidden error if permission check fails.
 */
export function assertPermission(
  user: AuthenticatedUser | null | undefined,
  requiredPermission: string,
  resourceName?: string
): asserts user is AuthenticatedUser {
  assertActiveUser(user);
  if (!hasPermission(user, requiredPermission)) {
    throw new Error(
      `Forbidden: Server-side RBAC rejected access to ${resourceName ?? "resource"}. Required permission: ${requiredPermission}, provided role: ${user.role}.`
    );
  }
}
