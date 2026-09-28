import { describe, it, expect, beforeEach } from "vitest";
import { UserRole, CaseStage, CaseState } from "@prisma/client";
import { prisma } from "../../src/server/db";
import { officerService } from "../../src/server/services/officer.service";
import { AuthenticatedUser } from "../../src/server/auth/roles";
import {
  OfficerQueueFilterSchema,
  AddOfficerNoteSchema,
  TransitionCaseStageSchema,
} from "../../src/server/domain/officer/validators";

describe("Phase 2I: Officer Case Review Workspace & Split-Screen Evidence", () => {
  const officerActor: AuthenticatedUser = {
    id: "usr_demo_officer_001",
    name: "Priya Sharma",
    email: "priya.sharma@tribal.gov.in",
    role: UserRole.VERIFICATION_OFFICER,
  };

  const applicantActor: AuthenticatedUser = {
    id: "usr_demo_applicant_001",
    name: "Ramesh Kumar Meena",
    email: "ramesh.meena@example.tribal.gov.in",
    role: UserRole.APPLICANT,
  };

  const demoCaseId = "case_demo_nos_001";
  const demoApplicationId = "app_demo_nos_sub_001";

  // =========================================================================
  // 1. PURE DOMAIN & VALIDATOR TESTS
  // =========================================================================
  describe("1. Pure Domain & Input Validators", () => {
    it("validates valid queue filter queries and sets defaults", () => {
      const parsed = OfficerQueueFilterSchema.parse({
        schemeCode: "NOS",
        currentStage: "OFFICER_REVIEW",
        page: "2",
        pageSize: "15",
      });

      expect(parsed.schemeCode).toBe("NOS");
      expect(parsed.currentStage).toBe("OFFICER_REVIEW");
      expect(parsed.page).toBe(2);
      expect(parsed.pageSize).toBe(15);
      expect(parsed.sortBy).toBe("oldestSubmission");
    });

    it("rejects invalid page or negative pageSize", () => {
      expect(() =>
        OfficerQueueFilterSchema.parse({
          page: "-1",
        })
      ).toThrow();

      expect(() =>
        OfficerQueueFilterSchema.parse({
          pageSize: "0",
        })
      ).toThrow();
    });

    it("validates officer note payload with minimum length requirements", () => {
      const valid = AddOfficerNoteSchema.parse({
        note: "Verified caste validity with Tehsildar office gazette.",
      });
      expect(valid.note).toContain("Tehsildar");

      expect(() =>
        AddOfficerNoteSchema.parse({
          note: "  ",
        })
      ).toThrow();
    });

    it("validates stage transition payloads and target stages", () => {
      const valid = TransitionCaseStageSchema.parse({
        targetStage: "COMMITTEE_SELECTION",
        remark: "All evidence verified. Recommending for selection panel.",
      });
      expect(valid.targetStage).toBe("COMMITTEE_SELECTION");
      expect(valid.remark).toContain("panel");

      expect(() =>
        TransitionCaseStageSchema.parse({
          targetStage: "INVALID_STAGE" as any,
        })
      ).toThrow();
    });
  });

  // =========================================================================
  // 2. QUEUE LISTING & FILTERING
  // =========================================================================
  describe("2. Queue Listing & Metrics Aggregation", () => {
    it("returns paginated cases with KPI summary metrics", async () => {
      const queue = await officerService.listCaseQueue(
        {
          schemeCode: "ALL",
          sortBy: "oldestSubmission",
          page: 1,
          pageSize: 20,
        },
        officerActor
      );

      expect(queue).toBeDefined();
      expect(queue.total).toBeGreaterThanOrEqual(1);
      expect(queue.items.length).toBeGreaterThanOrEqual(1);
      expect(queue.counts).toBeDefined();
      expect(queue.counts.totalAssigned).toBeGreaterThanOrEqual(0);

      const firstCase = queue.items[0];
      expect(firstCase.caseNumber).toBeDefined();
      expect(firstCase.applicantName).toBeDefined();
      expect(firstCase.schemeCode).toBeDefined();
      expect(firstCase.currentStage).toBeDefined();
      expect(firstCase.eligibilityAssessment).toBeDefined();
    });

    it("filters case queue by scheme code correctly", async () => {
      const queue = await officerService.listCaseQueue(
        {
          schemeCode: "NOS",
          sortBy: "oldestSubmission",
          page: 1,
          pageSize: 10,
        },
        officerActor
      );

      expect(queue).toBeDefined();
      for (const item of queue.items) {
        expect(item.schemeCode).toBe("NOS");
      }
    });

    it("rejects unauthorized applicant access to officer queue", async () => {
      await expect(
        officerService.listCaseQueue(
          {
            schemeCode: "ALL",
          },
          applicantActor
        )
      ).rejects.toThrow(/Forbidden/);
    });
  });

  // =========================================================================
  // 3. CASE WORKSPACE DETAIL & SPLIT-SCREEN AGGREGATION
  // =========================================================================
  describe("3. Case Workspace Detail Aggregation", () => {
    it("aggregates complete case dossier, applicant profile, scheme, documents, and bounding boxes", async () => {
      const detail = await officerService.getCaseWorkspaceDetail(demoCaseId, officerActor);

      expect(detail).toBeDefined();
      expect(detail.caseDossier.id).toBe(demoCaseId);
      expect(detail.applicant.name).toBeDefined();
      expect(detail.applicant.category).toBe("ST");
      expect(detail.scheme.code).toBe("NOS");
      expect(detail.documents.length).toBeGreaterThanOrEqual(1);

      // Verify documents have extracted fields structure and bounding boxes
      for (const doc of detail.documents) {
        expect(doc.id).toBeDefined();
        expect(doc.documentType).toBeDefined();
        expect(doc.storagePath).toBeDefined();

        for (const field of doc.extractedFields) {
          expect(field.fieldKey).toBeDefined();
          expect(field.confidenceScore).toBeGreaterThanOrEqual(0);
          expect(field.confidenceScore).toBeLessThanOrEqual(1);
          if (field.boundingBox) {
            expect(field.boundingBox.x).toBeGreaterThanOrEqual(0);
            expect(field.boundingBox.y).toBeGreaterThanOrEqual(0);
            expect(field.boundingBox.width).toBeGreaterThan(0);
            expect(field.boundingBox.height).toBeGreaterThan(0);
          }
        }
      }

      // Verify eligibility structure
      expect(detail.eligibility).toBeDefined();
      expect(detail.eligibility.rules).toBeDefined();

      // Verify timeline exists
      expect(detail.timeline.length).toBeGreaterThanOrEqual(1);
    });

    it("retrieves workspace detail by application ID fallback", async () => {
      const detail = await officerService.getCaseWorkspaceDetail(demoApplicationId, officerActor);
      expect(detail).toBeDefined();
      expect(detail.caseDossier.id).toBe(demoCaseId);
    });

    it("rejects applicant access to officer workspace detail", async () => {
      await expect(
        officerService.getCaseWorkspaceDetail(demoCaseId, applicantActor)
      ).rejects.toThrow(/Forbidden/);
    });
  });

  // =========================================================================
  // 4. CASE CLAIM, NOTES & STAGE ADVANCEMENT
  // =========================================================================
  describe("4. Case Claim, Notes & Stage Advancement", () => {
    beforeEach(async () => {
      // Reset demo case stage to OFFICER_REVIEW
      await prisma.caseDossier.update({
        where: { id: demoCaseId },
        data: {
          currentStage: CaseStage.OFFICER_REVIEW,
          currentState: CaseState.IN_PROGRESS,
          blocker: null,
          nextAction: "Officer review in progress.",
        },
      });

      // Clear test deficiencies
      await prisma.deficiency.deleteMany({
        where: { caseDossierId: demoCaseId },
      });
    });

    it("allows officer to claim case and records audit event", async () => {
      const updated = await officerService.claimCase(demoCaseId, officerActor);
      expect(updated.officerAssignedId).toBe(officerActor.id);

      const latestAudit = await prisma.auditLog.findFirst({
        where: {
          caseDossierId: demoCaseId,
          actionType: "OFFICER_CASE_CLAIMED",
        },
      });
      expect(latestAudit).toBeDefined();
      expect(latestAudit?.actorId).toBe(officerActor.id);
    });

    it("records officer review note in audit log", async () => {
      const res = await officerService.addOfficerNote(
        demoCaseId,
        {
          note: "Candidate mark sheet verified against National Academic Depository (NAD).",
        },
        officerActor
      );

      expect(res.success).toBe(true);
      expect(res.noteId).toBeDefined();

      const noteLog = await prisma.auditLog.findUnique({
        where: { id: res.noteId },
      });
      expect(noteLog?.actionType).toBe("OFFICER_REVIEW_NOTE_ADDED");
      const payload = noteLog?.payload as Record<string, unknown>;
      expect(payload?.note).toContain("National Academic Depository");
    });

    it("advances case to DEFICIENCY_PENDING when deficiency is required", async () => {
      const updated = await officerService.transitionCaseStage(
        demoCaseId,
        {
          targetStage: CaseStage.DEFICIENCY_PENDING,
          remark: "Income certificate expired; applicant notified to re-upload.",
        },
        officerActor
      );

      expect(updated.currentStage).toBe(CaseStage.DEFICIENCY_PENDING);
      expect(updated.currentState).toBe(CaseState.ACTION_REQUIRED);
    });

    it("prevents transition to COMMITTEE_SELECTION when open deficiencies exist", async () => {
      // Create an open deficiency
      await prisma.deficiency.create({
        data: {
          caseDossierId: demoCaseId,
          issuedById: officerActor.id,
          deficiencyType: "DOCUMENT_ILLEGIBLE",
          documentType: "CASTE_CERTIFICATE",
          description: "Digital seal cannot be verified.",
          responseDeadline: new Date(Date.now() + 14 * 86400000),
          status: "OPEN",
        },
      });

      await expect(
        officerService.transitionCaseStage(
          demoCaseId,
          {
            targetStage: CaseStage.COMMITTEE_SELECTION,
            remark: "Ready for committee.",
          },
          officerActor
        )
      ).rejects.toThrow(
        /Cannot advance case to Committee Selection while open deficiencies remain/
      );
    });

    it("allows transition to COMMITTEE_SELECTION when all deficiencies are resolved", async () => {
      // Resolve any existing deficiencies for this test case
      await prisma.deficiency.updateMany({
        where: { caseDossierId: demoCaseId },
        data: { status: "RESOLVED" },
      });

      const updated = await officerService.transitionCaseStage(
        demoCaseId,
        {
          targetStage: CaseStage.COMMITTEE_SELECTION,
          remark:
            "All criteria satisfied. Passing to Selection Committee for final scholarship award.",
        },
        officerActor
      );

      expect(updated.currentStage).toBe(CaseStage.COMMITTEE_SELECTION);
      expect(updated.currentState).toBe(CaseState.PENDING);

      const decisionAudit = await prisma.auditLog.findFirst({
        where: {
          caseDossierId: demoCaseId,
          actionType: "OFFICER_CASE_DECISION_RECORDED",
          actorId: officerActor.id,
        },
        orderBy: { createdAt: "desc" },
      });
      expect(decisionAudit?.previousState).toContain("OFFICER_REVIEW");
      expect(decisionAudit?.newState).toContain("COMMITTEE_SELECTION");
    });
  });
});
