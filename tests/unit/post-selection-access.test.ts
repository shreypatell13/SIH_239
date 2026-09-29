import { describe, it, expect } from "vitest";
import { UserRole } from "@prisma/client";
import {
  assertPostSelectionAccess,
  assertPostSelectionManagementAccess,
  assertScholarAccess,
  isOfficerOrManagement,
} from "@/server/auth/post-selection-access";
import { AuthenticatedUser } from "@/server/auth/roles";

describe("Phase 2K Post-Selection Access Control Policy", () => {
  const applicantUser: AuthenticatedUser = {
    id: "usr_applicant_001",
    email: "applicant@tribal.gov.in",
    name: "Applicant One",
    role: "APPLICANT" as UserRole,
    isActive: true,
  };

  const officerUser: AuthenticatedUser = {
    id: "usr_officer_001",
    email: "officer@tribal.gov.in",
    name: "Officer One",
    role: "VERIFICATION_OFFICER" as UserRole,
    isActive: true,
  };

  const directorUser: AuthenticatedUser = {
    id: "usr_director_001",
    email: "director@tribal.gov.in",
    name: "Director One",
    role: "OPERATIONS_DIRECTOR" as UserRole,
    isActive: true,
  };

  const inactiveUser: AuthenticatedUser = {
    id: "usr_inactive_001",
    email: "inactive@tribal.gov.in",
    name: "Inactive User",
    role: "APPLICANT" as UserRole,
    isActive: false,
  };

  it("identifies officer and management roles correctly", () => {
    expect(isOfficerOrManagement(UserRole.VERIFICATION_OFFICER)).toBe(true);
    expect(isOfficerOrManagement(UserRole.SCHEME_ADMIN)).toBe(true);
    expect(isOfficerOrManagement(UserRole.OPERATIONS_DIRECTOR)).toBe(true);
    expect(isOfficerOrManagement(UserRole.APPLICANT)).toBe(false);
  });

  it("assertPostSelectionAccess allows active users and rejects null or inactive users", () => {
    expect(() => assertPostSelectionAccess(applicantUser)).not.toThrow();
    expect(() => assertPostSelectionAccess(officerUser)).not.toThrow();
    expect(() => assertPostSelectionAccess(null)).toThrow(/active.*session/i);
    expect(() => assertPostSelectionAccess(inactiveUser)).toThrow(/inactive/i);
  });

  it("assertPostSelectionManagementAccess permits officer and director but rejects applicant", () => {
    expect(() => assertPostSelectionManagementAccess(officerUser)).not.toThrow();
    expect(() => assertPostSelectionManagementAccess(directorUser)).not.toThrow();
    expect(() => assertPostSelectionManagementAccess(applicantUser)).toThrow(
      /Officer or Management privileges required/
    );
  });

  it("assertScholarAccess allows owning applicant and officers but rejects foreign applicant", () => {
    // Owning applicant
    expect(() => assertScholarAccess(applicantUser, "usr_applicant_001")).not.toThrow();

    // Officer
    expect(() => assertScholarAccess(officerUser, "usr_applicant_001")).not.toThrow();

    // Director
    expect(() => assertScholarAccess(directorUser, "usr_applicant_001")).not.toThrow();

    // Foreign applicant
    expect(() => assertScholarAccess(applicantUser, "usr_other_applicant_999")).toThrow(
      /Access denied/
    );
  });
});
