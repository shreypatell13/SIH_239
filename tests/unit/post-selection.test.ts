import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  PrismaClient,
  RenewalStatus,
  ScholarStatus,
  UserRole,
  DisbursementRecordStatus,
} from "@prisma/client";
import { PostSelectionLifecyclePolicy } from "@/server/domain/post-selection/lifecycle";
import { PostSelectionRepository } from "@/server/repositories/post-selection.repository";
import { PostSelectionService } from "@/server/services/post-selection.service";

describe("Phase 2K Post-Selection Management & Renewal Workflows", () => {
  const prisma = new PrismaClient();
  let repo: PostSelectionRepository;
  let service: PostSelectionService;

  beforeAll(async () => {
    repo = new PostSelectionRepository(prisma);
    service = new PostSelectionService(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("1. Lifecycle & Transition Rules", () => {
    it("validates permissible renewal transitions", () => {
      expect(
        PostSelectionLifecyclePolicy.isValidRenewalTransition(
          RenewalStatus.UPCOMING,
          RenewalStatus.SUBMITTED
        )
      ).toBe(true);
      expect(
        PostSelectionLifecyclePolicy.isValidRenewalTransition(
          RenewalStatus.SUBMITTED,
          RenewalStatus.APPROVED
        )
      ).toBe(true);
      expect(
        PostSelectionLifecyclePolicy.isValidRenewalTransition(
          RenewalStatus.SUBMITTED,
          RenewalStatus.DEFICIENT
        )
      ).toBe(true);
      expect(
        PostSelectionLifecyclePolicy.isValidRenewalTransition(
          RenewalStatus.DEFICIENT,
          RenewalStatus.SUBMITTED
        )
      ).toBe(true);
      expect(
        PostSelectionLifecyclePolicy.isValidRenewalTransition(
          RenewalStatus.APPROVED,
          RenewalStatus.COMPLETED
        )
      ).toBe(true);

      // Invalid transitions
      expect(
        PostSelectionLifecyclePolicy.isValidRenewalTransition(
          RenewalStatus.APPROVED,
          RenewalStatus.SUBMITTED
        )
      ).toBe(false);
      expect(
        PostSelectionLifecyclePolicy.isValidRenewalTransition(
          RenewalStatus.REJECTED,
          RenewalStatus.APPROVED
        )
      ).toBe(false);
    });

    it("derives correct scholar status based on active renewal states", () => {
      expect(
        PostSelectionLifecyclePolicy.deriveScholarStatus(3, 1, [
          { status: RenewalStatus.APPROVED, renewalCycle: 1 },
          { status: RenewalStatus.UPCOMING, renewalCycle: 2 },
        ])
      ).toBe(ScholarStatus.RENEWAL_DUE);

      expect(
        PostSelectionLifecyclePolicy.deriveScholarStatus(3, 1, [
          { status: RenewalStatus.APPROVED, renewalCycle: 1 },
          { status: RenewalStatus.DEFICIENT, renewalCycle: 2 },
        ])
      ).toBe(ScholarStatus.ON_HOLD);

      expect(
        PostSelectionLifecyclePolicy.deriveScholarStatus(3, 3, [
          { status: RenewalStatus.APPROVED, renewalCycle: 1 },
          { status: RenewalStatus.APPROVED, renewalCycle: 2 },
          { status: RenewalStatus.APPROVED, renewalCycle: 3 },
        ])
      ).toBe(ScholarStatus.COMPLETED);
    });
  });

  describe("2. Database-Backed Repository & Service Operations", () => {
    const directorContext = {
      id: "usr_demo_management_001",
      userId: "usr_demo_management_001",
      role: UserRole.OPERATIONS_DIRECTOR,
      email: "sunita.rao@tribal.gov.in",
      name: "Dr. Sunita Rao",
    };

    const officerContext = {
      id: "usr_demo_officer_001",
      userId: "usr_demo_officer_001",
      role: UserRole.VERIFICATION_OFFICER,
      email: "priya.sharma@tribal.gov.in",
      name: "Priya Sharma",
    };

    const applicantContext = {
      id: "usr_demo_applicant_001",
      userId: "usr_demo_applicant_001",
      role: UserRole.APPLICANT,
      email: "ramesh.meena@example.tribal.gov.in",
      name: "Ramesh Kumar Meena",
    };

    it("retrieves live Post-Selection dashboard overview metrics", async () => {
      const metrics = await service.getOverview(directorContext);

      expect(metrics).toBeDefined();
      expect(metrics.totalScholars).toBeGreaterThanOrEqual(1);
      expect(metrics.activeScholars).toBeGreaterThanOrEqual(1);
      expect(metrics.totalAwardedAmount).toBeGreaterThan(0);
      expect(metrics.schemeDistribution.length).toBeGreaterThanOrEqual(1);
    });

    it("lists scholars with filters and role-based scoping", async () => {
      // Management list
      const managementList = await service.listScholars({}, directorContext);
      expect(managementList.total).toBeGreaterThanOrEqual(1);
      expect(managementList.scholars[0].applicantName).toBeDefined();
      expect(managementList.scholars[0].schemeCode).toBe("NOS");

      // Applicant list scoped to own profile
      const applicantList = await service.listScholars({}, applicantContext);
      expect(applicantList.total).toBeGreaterThanOrEqual(1);
      expect(applicantList.scholars.every((s) => s.applicantEmail === applicantContext.email)).toBe(
        true
      );
    });

    it("retrieves single scholar drill-down with renewals, disbursements, and documents", async () => {
      const { scholars } = await service.listScholars({}, directorContext);
      const target = scholars[0];

      const detail = await service.getScholarDetail(target.id, directorContext);
      expect(detail.id).toBe(target.id);
      expect(detail.renewals.length).toBeGreaterThanOrEqual(1);
      expect(detail.disbursements.length).toBeGreaterThanOrEqual(1);
      expect(detail.documents.length).toBeGreaterThanOrEqual(1);
    });

    it("allows scholar to submit annual progress report for upcoming cycle", async () => {
      const { renewals } = await service.listRenewals(
        { status: RenewalStatus.UPCOMING },
        officerContext
      );
      if (renewals.length > 0) {
        const target = renewals[0];

        const updated = await service.submitRenewal(
          target.id,
          {
            progressSummary:
              "Published 2 papers in IEEE Transactions and attended national symposium.",
            publicationsCount: 2,
            conferencesAttended: 1,
            supervisorRecommendation: "RECOMMENDED",
            supervisorRemarks: "Satisfactory research progress.",
          },
          applicantContext
        );

        expect(updated.status).toBe(RenewalStatus.SUBMITTED);
        expect(updated.publicationsCount).toBe(2);
        expect(updated.supervisorRecommendation).toBe("RECOMMENDED");
      }
    });

    it("allows officer to review and approve renewal cycle", async () => {
      const { renewals } = await service.listRenewals(
        { status: RenewalStatus.SUBMITTED },
        officerContext
      );
      if (renewals.length > 0) {
        const target = renewals[0];

        const reviewed = await service.reviewRenewal(
          target.id,
          {
            action: "APPROVE",
            officerRemarks: "Annual progress verified against publication milestones. Approved.",
          },
          officerContext
        );

        expect(reviewed.status).toBe(RenewalStatus.APPROVED);
        expect(reviewed.officerRemarks).toContain("Approved");
        expect(reviewed.reviewedById).toBe(officerContext.userId);
      }
    });

    it("updates mock disbursement status and sets synthetic PFMS reference", async () => {
      const { disbursements } = await service.listDisbursements({}, officerContext);
      const target =
        disbursements.find((d) => d.status === DisbursementRecordStatus.PENDING) ||
        disbursements[0];

      const updated = await service.updateDisbursementStatus(
        target.id,
        {
          status: DisbursementRecordStatus.PAID,
          remarks: "Disbursed via automated DBT batch credit.",
        },
        officerContext
      );
      const repeated = await service.updateDisbursementStatus(
        target.id,
        {
          status: DisbursementRecordStatus.PAID,
          remarks: "Disbursed via automated DBT batch credit.",
        },
        officerContext
      );

      expect(updated.status).toBe(DisbursementRecordStatus.PAID);
      expect(updated.pfmsReference).toMatch(/^PFMS-/);
      expect(repeated.pfmsReference).toBe(updated.pfmsReference);
      expect(updated.disbursedAt).toBeDefined();
    });
  });
});
