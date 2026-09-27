import { describe, it, expect } from "vitest";
import {
  UserRoleSchema,
  hasRole,
  hasPermission,
  assertAuthorized,
  AuthenticatedUser,
} from "@/server/auth/roles";
import { getDemoUser } from "@/server/auth/session";

describe("Server-Authoritative RBAC & Validation Tests", () => {
  it("should validate allowed roles with Zod schema", () => {
    expect(UserRoleSchema.safeParse("APPLICANT").success).toBe(true);
    expect(UserRoleSchema.safeParse("OFFICER").success).toBe(true);
    expect(UserRoleSchema.safeParse("ADMIN").success).toBe(true);
    expect(UserRoleSchema.safeParse("MANAGEMENT").success).toBe(true);
    expect(UserRoleSchema.safeParse("SUPERUSER").success).toBe(false);
  });

  it("should enforce server-side role checks correctly", () => {
    const officer = getDemoUser("OFFICER");
    expect(hasRole(officer, "OFFICER")).toBe(true);
    expect(hasRole(officer, "ADMIN")).toBe(false);
  });

  it("should verify role permissions strictly", () => {
    const applicant = getDemoUser("APPLICANT");
    const officer = getDemoUser("OFFICER");

    expect(hasPermission(applicant, "application:create")).toBe(true);
    expect(hasPermission(applicant, "case:adjudicate")).toBe(false);

    expect(hasPermission(officer, "case:adjudicate")).toBe(true);
    expect(hasPermission(officer, "scheme:create")).toBe(false);
  });

  it("should throw Forbidden error when unauthorized role attempts access", () => {
    const applicant: AuthenticatedUser = {
      id: "test_user",
      email: "test@example.com",
      name: "Test User",
      role: "APPLICANT",
    };

    expect(() => assertAuthorized(applicant, "OFFICER", "Officer Case Desk")).toThrow(
      /Forbidden: Server-side RBAC rejected access/
    );
  });
});
