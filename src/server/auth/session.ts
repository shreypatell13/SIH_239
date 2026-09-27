import { AuthenticatedUser, UserRole } from "./roles";

export const DEMO_USERS: Record<UserRole, AuthenticatedUser> = {
  APPLICANT: {
    id: "usr_demo_applicant_001",
    email: "ramesh.meena@example.tribal.gov.in",
    name: "Ramesh Kumar Meena (Applicant)",
    role: "APPLICANT",
    isDemoSession: true,
  },
  VERIFICATION_OFFICER: {
    id: "usr_demo_officer_001",
    email: "priya.sharma@tribal.gov.in",
    name: "Priya Sharma (Verification Officer)",
    role: "VERIFICATION_OFFICER",
    isDemoSession: true,
  },
  SCHEME_ADMIN: {
    id: "usr_demo_admin_001",
    email: "rajesh.verma@tribal.gov.in",
    name: "Rajesh Verma (Scheme Administrator)",
    role: "SCHEME_ADMIN",
    isDemoSession: true,
  },
  OPERATIONS_DIRECTOR: {
    id: "usr_demo_management_001",
    email: "sunita.rao@tribal.gov.in",
    name: "Dr. Sunita Rao (Operations Director)",
    role: "OPERATIONS_DIRECTOR",
    isDemoSession: true,
  },
};

/**
 * Returns the active user for the given role context (development/demo helper).
 * Note: In production, this resolves strictly from verified NextAuth session tokens.
 */
export function getDemoUser(role: UserRole): AuthenticatedUser {
  return DEMO_USERS[role];
}
