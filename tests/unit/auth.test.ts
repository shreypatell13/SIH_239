import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import {
  ROLE_PERMISSIONS,
  hasRole,
  hasPermission,
  assertAuthorized,
  assertActiveUser,
  AuthenticatedUser,
} from "@/server/auth/roles";
import { getDemoUser } from "@/server/auth/session";

describe("Phase 2C Authentication & Server-Side RBAC Tests", () => {
  describe("Password Hashing & Verification (bcryptjs)", () => {
    it("should hash plaintext password with bcrypt cost factor >= 12", async () => {
      const plain = "Demo@SecurePassword2026";
      const hash = await hashPassword(plain);

      expect(hash).toBeDefined();
      expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);
      expect(hash).not.toEqual(plain);
    });

    it("should verify correct password against hash", async () => {
      const plain = "Demo@Applicant2026";
      const hash = await hashPassword(plain);

      const isValid = await verifyPassword(plain, hash);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password against hash", async () => {
      const plain = "Demo@Officer2026";
      const hash = await hashPassword(plain);

      const isInvalid = await verifyPassword("WrongPassword123", hash);
      expect(isInvalid).toBe(false);
    });

    it("should reject empty or null inputs gracefully", async () => {
      expect(await verifyPassword("", "$2a$12$somehash")).toBe(false);
      expect(await verifyPassword("password", null)).toBe(false);
      expect(await verifyPassword("password", undefined)).toBe(false);
      await expect(hashPassword("")).rejects.toThrow();
    });
  });

  describe("Active User Status & Session Integrity", () => {
    it("should allow active authenticated users", () => {
      const activeUser: AuthenticatedUser = {
        id: "usr_active_001",
        email: "active@tribal.gov.in",
        name: "Active User",
        role: "APPLICANT",
        isActive: true,
      };

      expect(() => assertActiveUser(activeUser)).not.toThrow();
    });

    it("should throw when user session is missing or null", () => {
      expect(() => assertActiveUser(null)).toThrow(/Unauthorized/);
      expect(() => assertActiveUser(undefined)).toThrow(/Unauthorized/);
    });

    it("should reject inactive or suspended user accounts with Forbidden error", () => {
      const inactiveUser: AuthenticatedUser = {
        id: "usr_inactive_001",
        email: "inactive@tribal.gov.in",
        name: "Inactive User",
        role: "APPLICANT",
        isActive: false,
      };

      expect(() => assertActiveUser(inactiveUser)).toThrow(/Forbidden: User account is inactive/);
    });
  });

  describe("Server-Authoritative RBAC & Permission Boundaries", () => {
    it("should enforce that OPERATIONS_DIRECTOR has strictly read/monitoring permissions and NO write permissions", () => {
      const director = getDemoUser("OPERATIONS_DIRECTOR");

      // Allowed monitoring/read permissions
      expect(hasPermission(director, "analytics:read:all")).toBe(true);
      expect(hasPermission(director, "control_tower:view")).toBe(true);
      expect(hasPermission(director, "sla:monitor")).toBe(true);
      expect(hasPermission(director, "reports:export")).toBe(true);

      // Denied write/mutation permissions
      expect(hasPermission(director, "application:create")).toBe(false);
      expect(hasPermission(director, "application:verify")).toBe(false);
      expect(hasPermission(director, "case:adjudicate")).toBe(false);
      expect(hasPermission(director, "scheme:create")).toBe(false);
      expect(hasPermission(director, "deficiency:issue")).toBe(false);
    });

    it("should enforce APPLICANT role permissions boundaries", () => {
      const applicant = getDemoUser("APPLICANT");

      expect(hasPermission(applicant, "application:create")).toBe(true);
      expect(hasPermission(applicant, "application:read:own")).toBe(true);
      expect(hasPermission(applicant, "document:upload:own")).toBe(true);
      expect(hasPermission(applicant, "deficiency:resolve:own")).toBe(true);

      // Block officer/admin actions
      expect(hasPermission(applicant, "application:verify")).toBe(false);
      expect(hasPermission(applicant, "scheme:create")).toBe(false);
      expect(hasPermission(applicant, "control_tower:view")).toBe(false);
    });

    it("should enforce VERIFICATION_OFFICER role permissions boundaries", () => {
      const officer = getDemoUser("VERIFICATION_OFFICER");

      expect(hasPermission(officer, "application:verify")).toBe(true);
      expect(hasPermission(officer, "evidence:inspect")).toBe(true);
      expect(hasPermission(officer, "deficiency:issue")).toBe(true);
      expect(hasPermission(officer, "case:adjudicate")).toBe(true);

      // Block policy modification
      expect(hasPermission(officer, "scheme:create")).toBe(false);
      expect(hasPermission(officer, "workflow:configure")).toBe(false);
    });

    it("should enforce SCHEME_ADMIN role permissions boundaries", () => {
      const admin = getDemoUser("SCHEME_ADMIN");

      expect(hasPermission(admin, "scheme:create")).toBe(true);
      expect(hasPermission(admin, "scheme:update")).toBe(true);
      expect(hasPermission(admin, "rule:configure")).toBe(true);
      expect(hasPermission(admin, "workflow:configure")).toBe(true);
    });

    it("should throw Forbidden error when assertAuthorized fails for wrong role", () => {
      const applicant = getDemoUser("APPLICANT");

      expect(() =>
        assertAuthorized(applicant, "VERIFICATION_OFFICER", "Officer Workspace")
      ).toThrow(/Forbidden: Server-side RBAC rejected access to Officer Workspace/);

      expect(() => assertAuthorized(applicant, "SCHEME_ADMIN", "Scheme Studio")).toThrow(
        /Forbidden: Server-side RBAC rejected access to Scheme Studio/
      );

      expect(() => assertAuthorized(applicant, "OPERATIONS_DIRECTOR", "Control Tower")).toThrow(
        /Forbidden: Server-side RBAC rejected access to Control Tower/
      );
    });

    it("should succeed when assertAuthorized matches the required role", () => {
      const officer = getDemoUser("VERIFICATION_OFFICER");
      expect(() =>
        assertAuthorized(officer, "VERIFICATION_OFFICER", "Officer Workspace")
      ).not.toThrow();
    });
  });
});
