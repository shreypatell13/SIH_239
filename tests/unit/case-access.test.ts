import { describe, expect, it } from "vitest";
import { canAccessCase, assertCanAccessCase } from "@/server/auth/case-access";
import { AuthenticatedUser } from "@/server/auth/roles";
import { combineQueueScopeAndSearch } from "@/server/repositories/case.repository";
import { canOfficerTransition } from "@/server/domain/officer/workflow";
import { CaseStage } from "@prisma/client";

const caseRecord = (officerAssignedId: string | null, owner = "applicant-a") => ({
  id: "case-1",
  officerAssignedId,
  application: { submittedById: owner },
});
const applicant: AuthenticatedUser = {
  id: "applicant-a",
  role: "APPLICANT",
  email: "a@test",
  name: "A",
};
const otherApplicant: AuthenticatedUser = { ...applicant, id: "applicant-b" };
const officer: AuthenticatedUser = {
  id: "officer-a",
  role: "VERIFICATION_OFFICER",
  email: "o@test",
  name: "O",
};
const otherOfficer: AuthenticatedUser = { ...officer, id: "officer-b" };
const admin: AuthenticatedUser = { id: "admin", role: "SCHEME_ADMIN", email: "x@test", name: "X" };
const director: AuthenticatedUser = {
  id: "director",
  role: "OPERATIONS_DIRECTOR",
  email: "d@test",
  name: "D",
};

describe("case resource access policy", () => {
  it("allows applicants their own document and blocks another applicant", () => {
    expect(canAccessCase(applicant, caseRecord(null), "document-read")).toBe(true);
    expect(canAccessCase(otherApplicant, caseRecord(null), "document-read")).toBe(false);
    expect(canAccessCase(applicant, caseRecord(null), "read")).toBe(false);
  });
  it("allows officers only their assigned or unassigned cases", () => {
    expect(canAccessCase(officer, caseRecord("officer-a"), "read")).toBe(true);
    expect(canAccessCase(officer, caseRecord("officer-a"), "document-read")).toBe(true);
    expect(canAccessCase(officer, caseRecord("officer-b"), "read")).toBe(false);
    expect(canAccessCase(officer, caseRecord(null), "act")).toBe(true);
    expect(() => assertCanAccessCase(otherOfficer, caseRecord("officer-a"), "act")).toThrow(
      /Forbidden/
    );
  });
  it("honors explicit higher-role resource permissions", () => {
    expect(canAccessCase(admin, caseRecord("officer-a"), "document-read")).toBe(true);
    expect(canAccessCase(director, caseRecord("officer-a"), "read")).toBe(true);
    expect(canAccessCase(director, caseRecord("officer-a"), "document-read")).toBe(false);
  });
});

describe("officer queue search scope", () => {
  it("combines assignment authorization and search with AND", () => {
    const scope = { OR: [{ officerAssignedId: "officer-a" }, { officerAssignedId: null }] };
    const search = {
      OR: [
        { caseNumber: { contains: "CASE-Y" } },
        { application: { applicationNumber: { contains: "APP-Y" } } },
      ],
    };
    const where = combineQueueScopeAndSearch(scope, search);
    expect(where).toEqual({ AND: [scope, search] });
  });
  it("preserves pagination-independent search when a global scope is absent", () => {
    const search = { OR: [{ caseNumber: { contains: "CASE-X" } }] };
    expect(combineQueueScopeAndSearch(undefined, search)).toEqual({ AND: [search] });
  });
});

describe("human officer workflow transitions", () => {
  it("allows review decisions and rejects transitions from terminal or wrong stages", () => {
    expect(canOfficerTransition(CaseStage.OFFICER_REVIEW, CaseStage.REJECTED)).toBe(true);
    expect(canOfficerTransition(CaseStage.OFFICER_REVIEW, CaseStage.COMMITTEE_SELECTION)).toBe(
      true
    );
    expect(canOfficerTransition(CaseStage.OFFICER_REVIEW, CaseStage.DEFICIENCY_PENDING)).toBe(true);
    expect(canOfficerTransition(CaseStage.SANCTIONED, CaseStage.REJECTED)).toBe(false);
    expect(canOfficerTransition(CaseStage.SUBMITTED, CaseStage.REJECTED)).toBe(false);
  });
});
