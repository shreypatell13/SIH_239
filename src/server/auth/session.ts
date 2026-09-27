import { getServerSession } from "next-auth";
import { nextAuthConfig } from "./nextauth.config";
import { AuthenticatedUser, UserRole } from "./roles";

/**
 * Static mock personas used strictly for testing and deterministic test suites.
 * @internal @testOnly
 */
export const DEMO_USERS: Record<UserRole, AuthenticatedUser> = {
  APPLICANT: {
    id: "usr_demo_applicant_001",
    email: "ramesh.meena@example.tribal.gov.in",
    name: "Ramesh Kumar Meena (Applicant)",
    role: "APPLICANT",
    isActive: true,
    isDemoSession: true,
  },
  VERIFICATION_OFFICER: {
    id: "usr_demo_officer_001",
    email: "priya.sharma@tribal.gov.in",
    name: "Priya Sharma (Verification Officer)",
    role: "VERIFICATION_OFFICER",
    isActive: true,
    isDemoSession: true,
  },
  SCHEME_ADMIN: {
    id: "usr_demo_admin_001",
    email: "rajesh.verma@tribal.gov.in",
    name: "Rajesh Verma (Scheme Administrator)",
    role: "SCHEME_ADMIN",
    isActive: true,
    isDemoSession: true,
  },
  OPERATIONS_DIRECTOR: {
    id: "usr_demo_management_001",
    email: "sunita.rao@tribal.gov.in",
    name: "Dr. Sunita Rao (Operations Director)",
    role: "OPERATIONS_DIRECTOR",
    isActive: true,
    isDemoSession: true,
  },
};

/**
 * Returns the static demo user for test assertions.
 * WARNING: NEVER call this from production routes, pages, or authorization guards.
 * @internal @testOnly
 */
export function getDemoUser(role: UserRole): AuthenticatedUser {
  return DEMO_USERS[role];
}

/**
 * Production-authoritative session resolver for Server Components and Route Handlers.
 * Extracts and validates the active NextAuth JWT session from the incoming request.
 */
export async function getServerAuthUser(): Promise<AuthenticatedUser | null> {
  const session = await getServerSession(nextAuthConfig);
  if (!session?.user?.id || !session?.user?.role) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? session.user.email,
    role: session.user.role,
    isActive: session.user.isActive ?? true,
    isDemoSession: Boolean(session.user.isDemoSession),
  };
}
