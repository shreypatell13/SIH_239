import { describe, expect, it } from "vitest";
import { UserRole } from "@prisma/client";
import { assertOperationsAccess } from "../../src/server/auth/operations-access";

describe("operations dashboard access", () => {
  it("permits an active operations director", () => {
    expect(() =>
      assertOperationsAccess({
        id: "director-1",
        email: "director@example.invalid",
        name: "Operations Director",
        role: UserRole.OPERATIONS_DIRECTOR,
      })
    ).not.toThrow();
  });

  it.each([UserRole.APPLICANT, UserRole.VERIFICATION_OFFICER, UserRole.SCHEME_ADMIN])(
    "denies %s from management analytics",
    (role) => {
      expect(() =>
        assertOperationsAccess({
          id: "user-1",
          email: "user@example.invalid",
          name: "User",
          role,
        })
      ).toThrow(/Forbidden/);
    }
  );
});
