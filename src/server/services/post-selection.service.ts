import {
  PrismaClient,
  RenewalStatus,
  ScholarStatus,
  DisbursementStatus,
  DisbursementRecordStatus,
  UserRole,
} from "@prisma/client";
import { prisma as defaultPrisma } from "../db";
import { PostSelectionRepository } from "../repositories/post-selection.repository";
import { AuditRepository } from "../repositories/audit.repository";
import { CaseRepository } from "../repositories/case.repository";
import {
  ScholarSummaryDTO,
  ScholarDetailDTO,
  RenewalDTO,
  DisbursementDTO,
  PostSelectionMetricsDTO,
  ScholarFilterParams,
  RenewalFilterParams,
  DisbursementFilterParams,
  UserContext,
} from "../domain/post-selection/types";
import {
  assertPostSelectionAccess,
  assertPostSelectionManagementAccess,
  assertScholarAccess,
  isOfficerOrManagement,
} from "../auth/post-selection-access";
import { PostSelectionLifecyclePolicy } from "../domain/post-selection/lifecycle";

export class PostSelectionService {
  private repo: PostSelectionRepository;
  private auditRepo: AuditRepository;
  private caseRepo: CaseRepository;

  constructor(private prisma: PrismaClient) {
    this.repo = new PostSelectionRepository(prisma);
    this.auditRepo = new AuditRepository();
    this.caseRepo = new CaseRepository();
  }

  /**
   * Get overall Post-Selection dashboard metrics.
   */
  async getOverview(user: UserContext): Promise<PostSelectionMetricsDTO> {
    assertPostSelectionAccess(user);
    return this.repo.getMetrics();
  }

  /**
   * List scholars with pagination and role-based scoping.
   */
  async listScholars(
    filters: ScholarFilterParams,
    user: UserContext
  ): Promise<{ scholars: ScholarSummaryDTO[]; total: number }> {
    assertPostSelectionAccess(user);

    let scope: { applicantProfileId?: string } | undefined;
    if (user.role === UserRole.APPLICANT) {
      const profile = await this.prisma.applicantProfile.findUnique({
        where: { userId: user.id },
      });
      if (!profile) {
        return { scholars: [], total: 0 };
      }
      scope = { applicantProfileId: profile.id };
    }

    const { scholars, total } = await this.repo.findScholars(filters, scope);

    const dtos: ScholarSummaryDTO[] = scholars.map((s) => ({
      id: s.id,
      caseDossierId: s.caseDossierId,
      caseNumber: s.caseDossier.caseNumber,
      applicationNumber: s.caseDossier.application.applicationNumber,
      applicantProfileId: s.applicantProfileId,
      applicantName: s.applicantProfile.user.name || "Scholar",
      applicantEmail: s.applicantProfile.user.email,
      category: s.applicantProfile.category,
      stateDomicile: s.applicantProfile.stateDomicile,
      schemeId: s.schemeVersion.scheme.id,
      schemeCode: s.schemeVersion.scheme.code,
      schemeName: s.schemeVersion.scheme.name,
      schemeVersionNumber: s.schemeVersion.versionNumber,
      awardedAmount: Number(s.awardedAmount),
      tenureStartDate: s.tenureStartDate.toISOString(),
      tenureEndDate: s.tenureEndDate.toISOString(),
      researchInstitution: s.researchInstitution,
      supervisorName: s.supervisorName,
      fellowshipType: s.fellowshipType,
      disbursementStatus: s.disbursementStatus,
      scholarStatus: s.scholarStatus,
      currentYear: s.currentYear,
      totalTenureYears: s.totalTenureYears,
      pfmsReferenceId: s.pfmsReferenceId,
      renewalDueDate: s.renewalDueDate?.toISOString() || null,
      continuationApproved: s.continuationApproved,
      remarks: s.remarks,
      activeRenewalsCount: s.renewals.filter(
        (r: any) => r.status !== RenewalStatus.COMPLETED && r.status !== RenewalStatus.REJECTED
      ).length,
      pendingDisbursementsCount: s.disbursements.filter(
        (d: any) =>
          d.status === DisbursementRecordStatus.PENDING ||
          d.status === DisbursementRecordStatus.PROCESSING
      ).length,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    return { scholars: dtos, total };
  }

  /**
   * Get detailed scholar record.
   */
  async getScholarDetail(scholarId: string, user: UserContext): Promise<ScholarDetailDTO> {
    assertPostSelectionAccess(user);

    const s = await this.repo.findById(scholarId);
    if (!s) {
      throw new Error("Scholar record not found.");
    }

    assertScholarAccess(user, s.applicantProfile.user.id);

    const renewals: RenewalDTO[] = s.renewals.map((r: any) => ({
      id: r.id,
      postSelectionRecordId: r.postSelectionRecordId,
      renewalCycle: r.renewalCycle,
      academicYear: r.academicYear,
      status: r.status,
      progressSummary: r.progressSummary,
      publicationsCount: r.publicationsCount,
      conferencesAttended: r.conferencesAttended,
      supervisorRecommendation: r.supervisorRecommendation,
      supervisorRemarks: r.supervisorRemarks,
      submissionDate: r.submissionDate?.toISOString() || null,
      reviewDate: r.reviewDate?.toISOString() || null,
      officerRemarks: r.officerRemarks,
      reviewedById: r.reviewedById,
      reviewedByName: r.reviewedBy?.name || null,
      recheckRequired: r.recheckRequired,
      deficiencyDetails: r.deficiencyDetails,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    const disbursements: DisbursementDTO[] = s.disbursements.map((d: any) => ({
      id: d.id,
      postSelectionRecordId: d.postSelectionRecordId,
      installmentNumber: d.installmentNumber,
      financialYear: d.financialYear,
      amount: Number(d.amount),
      status: d.status,
      pfmsReference: d.pfmsReference,
      scheduledDate: d.scheduledDate?.toISOString() || null,
      disbursedAt: d.disbursedAt?.toISOString() || null,
      remarks: d.remarks,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));

    const documents = s.caseDossier.documents.map((doc: any) => ({
      id: doc.id,
      documentType: doc.documentType,
      originalFilename: doc.originalFilename,
      mimeType: doc.mimeType,
      fileSizeBytes: doc.fileSizeBytes,
      uploadedAt: doc.uploadedAt.toISOString(),
      processingStatus: doc.processingStatus,
    }));

    const auditLogs = s.caseDossier.auditLogs.map((log: any) => ({
      id: log.id,
      actorName: log.actor?.name || "System",
      actorRole: log.actorRole,
      actionType: log.actionType,
      previousState: log.previousState,
      newState: log.newState,
      createdAt: log.createdAt.toISOString(),
    }));

    return {
      id: s.id,
      caseDossierId: s.caseDossierId,
      caseNumber: s.caseDossier.caseNumber,
      applicationNumber: s.caseDossier.application.applicationNumber,
      applicantProfileId: s.applicantProfileId,
      applicantName: s.applicantProfile.user.name || "Scholar",
      applicantEmail: s.applicantProfile.user.email,
      academicQualification: s.applicantProfile.academicQualification,
      institutionName: s.applicantProfile.institutionName,
      mobile: s.applicantProfile.mobile,
      aadhaarLast4: s.applicantProfile.aadhaarLast4,
      category: s.applicantProfile.category,
      stateDomicile: s.applicantProfile.stateDomicile,
      schemeId: s.schemeVersion.scheme.id,
      schemeCode: s.schemeVersion.scheme.code,
      schemeName: s.schemeVersion.scheme.name,
      schemeVersionNumber: s.schemeVersion.versionNumber,
      awardedAmount: Number(s.awardedAmount),
      tenureStartDate: s.tenureStartDate.toISOString(),
      tenureEndDate: s.tenureEndDate.toISOString(),
      researchInstitution: s.researchInstitution,
      supervisorName: s.supervisorName,
      fellowshipType: s.fellowshipType,
      disbursementStatus: s.disbursementStatus,
      scholarStatus: s.scholarStatus,
      currentYear: s.currentYear,
      totalTenureYears: s.totalTenureYears,
      pfmsReferenceId: s.pfmsReferenceId,
      renewalDueDate: s.renewalDueDate?.toISOString() || null,
      continuationApproved: s.continuationApproved,
      remarks: s.remarks,
      activeRenewalsCount: renewals.filter(
        (r) => r.status !== RenewalStatus.COMPLETED && r.status !== RenewalStatus.REJECTED
      ).length,
      pendingDisbursementsCount: disbursements.filter(
        (d) =>
          d.status === DisbursementRecordStatus.PENDING ||
          d.status === DisbursementRecordStatus.PROCESSING
      ).length,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      renewals,
      disbursements,
      documents,
      auditLogs,
    };
  }

  /**
   * Enroll a selected/sanctioned case as an active scholar in the Post-Selection Registry.
   */
  async enrollScholarFromCase(
    caseDossierId: string,
    enrollData: {
      awardedAmount: number;
      tenureStartDate: string;
      tenureEndDate: string;
      researchInstitution?: string;
      supervisorName?: string;
      fellowshipType?: string;
      totalTenureYears?: number;
      remarks?: string;
    },
    user: UserContext
  ): Promise<ScholarDetailDTO> {
    assertPostSelectionManagementAccess(user);

    const existing = await this.repo.findByCaseDossierId(caseDossierId);
    if (existing) {
      throw new Error("Scholar record already exists for this case dossier.");
    }

    const dossier = await this.prisma.caseDossier.findUnique({
      where: { id: caseDossierId },
      include: {
        application: {
          include: {
            applicantProfile: true,
            schemeVersion: true,
          },
        },
      },
    });

    if (!dossier) {
      throw new Error("Case dossier not found.");
    }

    const tenureYears = enrollData.totalTenureYears || 3;
    const startYear = new Date(enrollData.tenureStartDate).getFullYear();
    const renewalDueDate = new Date(enrollData.tenureStartDate);
    renewalDueDate.setFullYear(renewalDueDate.getFullYear() + 1);

    const scholar = await this.prisma.postSelectionRecord.create({
      data: {
        caseDossierId: dossier.id,
        applicantProfileId: dossier.application.applicantProfileId,
        schemeVersionId: dossier.application.schemeVersionId,
        awardedAmount: enrollData.awardedAmount,
        tenureStartDate: new Date(enrollData.tenureStartDate),
        tenureEndDate: new Date(enrollData.tenureEndDate),
        researchInstitution:
          enrollData.researchInstitution || dossier.application.applicantProfile.institutionName,
        supervisorName: enrollData.supervisorName,
        fellowshipType: enrollData.fellowshipType || "JRF",
        disbursementStatus: DisbursementStatus.PENDING,
        scholarStatus: ScholarStatus.ACTIVE,
        currentYear: 1,
        totalTenureYears: tenureYears,
        renewalDueDate,
        remarks: enrollData.remarks,
        renewals: {
          create: [
            {
              renewalCycle: 1,
              academicYear: `${startYear}-${startYear + 1}`,
              status: RenewalStatus.APPROVED,
              submissionDate: new Date(),
              reviewDate: new Date(),
              officerRemarks: "Initial selection award and Year 1 tenure approved.",
              supervisorRecommendation: "RECOMMENDED",
            },
            {
              renewalCycle: 2,
              academicYear: `${startYear + 1}-${startYear + 2}`,
              status: RenewalStatus.UPCOMING,
            },
          ],
        },
        disbursements: {
          create: [
            {
              installmentNumber: 1,
              financialYear: `${startYear}-${startYear + 1}`,
              amount: enrollData.awardedAmount / tenureYears,
              status: DisbursementRecordStatus.PENDING,
              remarks: "Year 1 fellowship stipend disbursement",
            },
            {
              installmentNumber: 2,
              financialYear: `${startYear + 1}-${startYear + 2}`,
              amount: enrollData.awardedAmount / tenureYears,
              status: DisbursementRecordStatus.PENDING,
              remarks: "Year 2 fellowship stipend disbursement (contingent upon renewal)",
            },
          ],
        },
      },
    });

    await this.auditRepo.create({
      caseDossierId: dossier.id,
      actorId: user.id,
      actorRole: user.role,
      actionType: "SCHOLAR_ENROLLED",
      previousState: dossier.currentStage,
      newState: "POST_SELECTION_ACTIVE",
      payload: {
        scholarId: scholar.id,
        awardedAmount: enrollData.awardedAmount,
        tenureYears,
      },
    });

    return this.getScholarDetail(scholar.id, user);
  }

  /**
   * List renewals with filters and role scoping.
   */
  async listRenewals(
    filters: RenewalFilterParams,
    user: UserContext
  ): Promise<{ renewals: RenewalDTO[]; total: number }> {
    assertPostSelectionAccess(user);

    let scope: { applicantProfileId?: string } | undefined;
    if (user.role === UserRole.APPLICANT) {
      const profile = await this.prisma.applicantProfile.findUnique({
        where: { userId: user.id },
      });
      if (!profile) {
        return { renewals: [], total: 0 };
      }
      scope = { applicantProfileId: profile.id };
    }

    const { renewals, total } = await this.repo.findRenewals(filters, scope);

    const dtos: RenewalDTO[] = renewals.map((r: any) => ({
      id: r.id,
      postSelectionRecordId: r.postSelectionRecordId,
      scholarName: r.postSelectionRecord.applicantProfile.user.name || "Scholar",
      schemeCode: r.postSelectionRecord.schemeVersion.scheme.code,
      caseNumber: r.postSelectionRecord.caseDossier.caseNumber,
      renewalCycle: r.renewalCycle,
      academicYear: r.academicYear,
      status: r.status,
      progressSummary: r.progressSummary,
      publicationsCount: r.publicationsCount,
      conferencesAttended: r.conferencesAttended,
      supervisorRecommendation: r.supervisorRecommendation,
      supervisorRemarks: r.supervisorRemarks,
      submissionDate: r.submissionDate?.toISOString() || null,
      reviewDate: r.reviewDate?.toISOString() || null,
      officerRemarks: r.officerRemarks,
      reviewedById: r.reviewedById,
      reviewedByName: r.reviewedBy?.name || null,
      recheckRequired: r.recheckRequired,
      deficiencyDetails: r.deficiencyDetails,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return { renewals: dtos, total };
  }

  /**
   * Submit progress report / renewal request by scholar.
   */
  async submitRenewal(
    renewalId: string,
    data: {
      progressSummary: string;
      publicationsCount: number;
      conferencesAttended: number;
      supervisorRecommendation: string;
      supervisorRemarks?: string;
    },
    user: UserContext
  ): Promise<RenewalDTO> {
    assertPostSelectionAccess(user);

    const renewal = await this.repo.findRenewalById(renewalId);
    if (!renewal) {
      throw new Error("Renewal cycle not found.");
    }

    assertScholarAccess(user, renewal.postSelectionRecord.applicantProfile.user.id);

    if (
      renewal.status !== RenewalStatus.UPCOMING &&
      renewal.status !== RenewalStatus.DRAFT &&
      renewal.status !== RenewalStatus.DEFICIENT
    ) {
      throw new Error(`Cannot submit renewal from current status: ${renewal.status}`);
    }

    const updated = await this.repo.updateRenewal(renewalId, {
      status: RenewalStatus.SUBMITTED,
      progressSummary: data.progressSummary,
      publicationsCount: data.publicationsCount,
      conferencesAttended: data.conferencesAttended,
      supervisorRecommendation: data.supervisorRecommendation,
      supervisorRemarks: data.supervisorRemarks,
      submissionDate: new Date(),
    });

    await this.auditRepo.create({
      caseDossierId: renewal.postSelectionRecord.caseDossier.id,
      actorId: user.id,
      actorRole: user.role,
      actionType: "RENEWAL_SUBMITTED",
      previousState: renewal.status,
      newState: RenewalStatus.SUBMITTED,
      payload: {
        renewalId,
        renewalCycle: renewal.renewalCycle,
        academicYear: renewal.academicYear,
      },
    });

    return {
      id: updated.id,
      postSelectionRecordId: updated.postSelectionRecordId,
      scholarName: renewal.postSelectionRecord.applicantProfile.user.name || "Scholar",
      schemeCode: renewal.postSelectionRecord.schemeVersion.scheme.code,
      caseNumber: renewal.postSelectionRecord.caseDossier.caseNumber,
      renewalCycle: updated.renewalCycle,
      academicYear: updated.academicYear,
      status: updated.status,
      progressSummary: updated.progressSummary,
      publicationsCount: updated.publicationsCount,
      conferencesAttended: updated.conferencesAttended,
      supervisorRecommendation: updated.supervisorRecommendation,
      supervisorRemarks: updated.supervisorRemarks,
      submissionDate: updated.submissionDate?.toISOString() || null,
      reviewDate: updated.reviewDate?.toISOString() || null,
      officerRemarks: updated.officerRemarks,
      reviewedById: updated.reviewedById,
      reviewedByName: null,
      recheckRequired: updated.recheckRequired,
      deficiencyDetails: updated.deficiencyDetails,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Human Officer Authoritative Review of Renewal Cycle.
   */
  async reviewRenewal(
    renewalId: string,
    actionData: {
      action: "APPROVE" | "REQUEST_DEFICIENCY" | "REJECT";
      officerRemarks: string;
      deficiencyDetails?: string;
      recheckRequired?: boolean;
    },
    user: UserContext
  ): Promise<RenewalDTO> {
    assertPostSelectionManagementAccess(user);

    const renewal = await this.repo.findRenewalById(renewalId);
    if (!renewal) {
      throw new Error("Renewal record not found.");
    }

    let nextStatus: RenewalStatus;
    let nextScholarStatus = renewal.postSelectionRecord.scholarStatus;
    let continuationApproved: boolean | undefined = undefined;

    if (actionData.action === "APPROVE") {
      nextStatus = RenewalStatus.APPROVED;
      nextScholarStatus = ScholarStatus.ACTIVE;
      continuationApproved = true;
    } else if (actionData.action === "REQUEST_DEFICIENCY") {
      nextStatus = RenewalStatus.DEFICIENT;
      nextScholarStatus = ScholarStatus.ON_HOLD;
    } else {
      nextStatus = RenewalStatus.REJECTED;
      nextScholarStatus = ScholarStatus.TERMINATED;
      continuationApproved = false;
    }

    const updated = await this.repo.updateRenewal(renewalId, {
      status: nextStatus,
      officerRemarks: actionData.officerRemarks,
      deficiencyDetails: actionData.deficiencyDetails || null,
      recheckRequired: actionData.recheckRequired || false,
      reviewDate: new Date(),
      reviewedBy: { connect: { id: user.id } },
    });

    // Update scholar record state if needed
    await this.repo.updateScholar(renewal.postSelectionRecordId, {
      scholarStatus: nextScholarStatus,
      ...(continuationApproved !== undefined ? { continuationApproved } : {}),
      ...(actionData.action === "APPROVE"
        ? { currentYear: Math.max(renewal.postSelectionRecord.currentYear, renewal.renewalCycle) }
        : {}),
    });

    await this.auditRepo.create({
      caseDossierId: renewal.postSelectionRecord.caseDossier.id,
      actorId: user.id,
      actorRole: user.role,
      actionType: `RENEWAL_${actionData.action}`,
      previousState: renewal.status,
      newState: nextStatus,
      payload: {
        renewalId,
        action: actionData.action,
        officerRemarks: actionData.officerRemarks,
        deficiencyDetails: actionData.deficiencyDetails,
      },
    });

    return {
      id: updated.id,
      postSelectionRecordId: updated.postSelectionRecordId,
      scholarName: renewal.postSelectionRecord.applicantProfile.user.name || "Scholar",
      schemeCode: renewal.postSelectionRecord.schemeVersion.scheme.code,
      caseNumber: renewal.postSelectionRecord.caseDossier.caseNumber,
      renewalCycle: updated.renewalCycle,
      academicYear: updated.academicYear,
      status: updated.status,
      progressSummary: updated.progressSummary,
      publicationsCount: updated.publicationsCount,
      conferencesAttended: updated.conferencesAttended,
      supervisorRecommendation: updated.supervisorRecommendation,
      supervisorRemarks: updated.supervisorRemarks,
      submissionDate: updated.submissionDate?.toISOString() || null,
      reviewDate: updated.reviewDate?.toISOString() || null,
      officerRemarks: updated.officerRemarks,
      reviewedById: updated.reviewedById,
      reviewedByName: user.name || "Verification Officer",
      recheckRequired: updated.recheckRequired,
      deficiencyDetails: updated.deficiencyDetails,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * List mock disbursements.
   */
  async listDisbursements(
    filters: DisbursementFilterParams,
    user: UserContext
  ): Promise<{ disbursements: DisbursementDTO[]; total: number }> {
    assertPostSelectionAccess(user);

    let scope: { applicantProfileId?: string } | undefined;
    if (user.role === UserRole.APPLICANT) {
      const profile = await this.prisma.applicantProfile.findUnique({
        where: { userId: user.id },
      });
      if (!profile) {
        return { disbursements: [], total: 0 };
      }
      scope = { applicantProfileId: profile.id };
    }

    const { disbursements, total } = await this.repo.findDisbursements(filters, scope);

    const dtos: DisbursementDTO[] = disbursements.map((d: any) => ({
      id: d.id,
      postSelectionRecordId: d.postSelectionRecordId,
      scholarName: d.postSelectionRecord.applicantProfile.user.name || "Scholar",
      schemeCode: d.postSelectionRecord.schemeVersion.scheme.code,
      caseNumber: d.postSelectionRecord.caseDossier.caseNumber,
      installmentNumber: d.installmentNumber,
      financialYear: d.financialYear,
      amount: Number(d.amount),
      status: d.status,
      pfmsReference: d.pfmsReference,
      scheduledDate: d.scheduledDate?.toISOString() || null,
      disbursedAt: d.disbursedAt?.toISOString() || null,
      remarks: d.remarks,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));

    return { disbursements: dtos, total };
  }

  /**
   * Update Mock Disbursement status.
   */
  async updateDisbursementStatus(
    disbursementId: string,
    updateData: {
      status: DisbursementRecordStatus;
      pfmsReference?: string;
      disbursedAt?: string;
      remarks?: string;
    },
    user: UserContext
  ): Promise<DisbursementDTO> {
    assertPostSelectionManagementAccess(user);

    const disbursement = await this.repo.findDisbursementById(disbursementId);
    if (!disbursement) {
      throw new Error("Disbursement record not found.");
    }

    let pfmsRef = updateData.pfmsReference;
    let disbursedAt = updateData.disbursedAt ? new Date(updateData.disbursedAt) : undefined;

    if (updateData.status === DisbursementRecordStatus.PAID) {
      if (!pfmsRef) {
        pfmsRef = `PFMS-${new Date().getFullYear()}-${disbursement.postSelectionRecord.schemeVersion.scheme.code}-${Math.floor(100000 + Math.random() * 900000)}`;
      }
      if (!disbursedAt) {
        disbursedAt = new Date();
      }
    }

    const updated = await this.repo.updateDisbursement(disbursementId, {
      status: updateData.status,
      pfmsReference: pfmsRef,
      disbursedAt,
      remarks: updateData.remarks,
    });

    // Check if scholar parent record disbursement status should update
    const allScholarDisbursements = await this.prisma.disbursementRecord.findMany({
      where: { postSelectionRecordId: disbursement.postSelectionRecordId },
    });

    const hasPaid = allScholarDisbursements.some((d) => d.status === DisbursementRecordStatus.PAID);
    const allPaid = allScholarDisbursements.every(
      (d) => d.status === DisbursementRecordStatus.PAID
    );
    const hasSuspended = allScholarDisbursements.some(
      (d) => d.status === DisbursementRecordStatus.HELD
    );

    let parentStatus: DisbursementStatus = DisbursementStatus.PENDING;
    if (hasSuspended) {
      parentStatus = DisbursementStatus.SUSPENDED;
    } else if (allPaid) {
      parentStatus = DisbursementStatus.COMPLETED;
    } else if (hasPaid) {
      parentStatus = DisbursementStatus.ONGOING;
    }

    await this.repo.updateScholar(disbursement.postSelectionRecordId, {
      disbursementStatus: parentStatus,
      ...(pfmsRef ? { pfmsReferenceId: pfmsRef } : {}),
    });

    await this.auditRepo.create({
      caseDossierId: disbursement.postSelectionRecord.caseDossier.id,
      actorId: user.id,
      actorRole: user.role,
      actionType: "DISBURSEMENT_STATUS_UPDATED",
      previousState: disbursement.status,
      newState: updateData.status,
      payload: {
        disbursementId,
        installmentNumber: disbursement.installmentNumber,
        pfmsReference: pfmsRef,
      },
    });

    return {
      id: updated.id,
      postSelectionRecordId: updated.postSelectionRecordId,
      scholarName: disbursement.postSelectionRecord.applicantProfile.user.name || "Scholar",
      schemeCode: disbursement.postSelectionRecord.schemeVersion.scheme.code,
      caseNumber: disbursement.postSelectionRecord.caseDossier.caseNumber,
      installmentNumber: updated.installmentNumber,
      financialYear: updated.financialYear,
      amount: Number(updated.amount),
      status: updated.status,
      pfmsReference: updated.pfmsReference,
      scheduledDate: updated.scheduledDate?.toISOString() || null,
      disbursedAt: updated.disbursedAt?.toISOString() || null,
      remarks: updated.remarks,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}

export const postSelectionService = new PostSelectionService(defaultPrisma);
