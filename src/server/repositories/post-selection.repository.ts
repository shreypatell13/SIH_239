import {
  PrismaClient,
  Prisma,
  PostSelectionRecord,
  ScholarRenewal,
  DisbursementRecord,
  RenewalStatus,
  ScholarStatus,
  DisbursementStatus,
  DisbursementRecordStatus,
} from "@prisma/client";
import { prisma as defaultPrisma } from "../db";
import {
  ScholarFilterParams,
  RenewalFilterParams,
  DisbursementFilterParams,
  PostSelectionMetricsDTO,
} from "../domain/post-selection/types";

export class PostSelectionRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * List scholars with pagination, filters, and role-based scoping.
   */
  async findScholars(
    filters: ScholarFilterParams,
    scope?: { applicantProfileId?: string }
  ): Promise<{ scholars: any[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.PostSelectionRecordWhereInput = {};

    if (scope?.applicantProfileId) {
      where.applicantProfileId = scope.applicantProfileId;
    }

    if (filters.scholarStatus) {
      where.scholarStatus = filters.scholarStatus;
    }

    if (filters.disbursementStatus) {
      where.disbursementStatus = filters.disbursementStatus;
    }

    if (filters.fellowshipType) {
      where.fellowshipType = { contains: filters.fellowshipType, mode: "insensitive" };
    }

    if (filters.schemeCode) {
      where.schemeVersion = {
        scheme: {
          code: { equals: filters.schemeCode, mode: "insensitive" },
        },
      };
    }

    if (filters.search) {
      const search = filters.search.trim();
      where.OR = [
        {
          applicantProfile: {
            user: {
              name: { contains: search, mode: "insensitive" },
            },
          },
        },
        {
          applicantProfile: {
            user: {
              email: { contains: search, mode: "insensitive" },
            },
          },
        },
        {
          caseDossier: {
            caseNumber: { contains: search, mode: "insensitive" },
          },
        },
        {
          caseDossier: {
            application: {
              applicationNumber: { contains: search, mode: "insensitive" },
            },
          },
        },
        {
          researchInstitution: { contains: search, mode: "insensitive" },
        },
      ];
    }

    const [records, total] = await Promise.all([
      this.prisma.postSelectionRecord.findMany({
        where,
        include: {
          applicantProfile: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          schemeVersion: {
            include: {
              scheme: true,
            },
          },
          caseDossier: {
            include: {
              application: true,
            },
          },
          renewals: {
            orderBy: { renewalCycle: "asc" },
          },
          disbursements: {
            orderBy: { installmentNumber: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.postSelectionRecord.count({ where }),
    ]);

    return { scholars: records, total };
  }

  /**
   * Find a single scholar by ID with all relations.
   */
  async findById(id: string) {
    return this.prisma.postSelectionRecord.findUnique({
      where: { id },
      include: {
        applicantProfile: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        schemeVersion: {
          include: {
            scheme: true,
          },
        },
        caseDossier: {
          include: {
            application: true,
            documents: {
              where: { isLatestVersion: true },
              orderBy: { uploadedAt: "desc" },
            },
            auditLogs: {
              include: {
                actor: {
                  select: { name: true, email: true },
                },
              },
              orderBy: { createdAt: "desc" },
              take: 20,
            },
          },
        },
        renewals: {
          include: {
            reviewedBy: {
              select: { name: true, email: true },
            },
          },
          orderBy: { renewalCycle: "asc" },
        },
        disbursements: {
          orderBy: { installmentNumber: "asc" },
        },
      },
    });
  }

  /**
   * Find a scholar by case dossier ID.
   */
  async findByCaseDossierId(caseDossierId: string) {
    return this.prisma.postSelectionRecord.findUnique({
      where: { caseDossierId },
      include: {
        applicantProfile: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        schemeVersion: {
          include: { scheme: true },
        },
        renewals: true,
        disbursements: true,
      },
    });
  }

  /**
   * Find scholar by applicant user ID.
   */
  async findByApplicantUserId(userId: string) {
    return this.prisma.postSelectionRecord.findFirst({
      where: {
        applicantProfile: {
          userId,
        },
      },
      include: {
        applicantProfile: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        schemeVersion: {
          include: { scheme: true },
        },
        caseDossier: {
          include: { application: true },
        },
        renewals: {
          orderBy: { renewalCycle: "asc" },
        },
        disbursements: {
          orderBy: { installmentNumber: "asc" },
        },
      },
    });
  }

  /**
   * Create a new post-selection scholar record.
   */
  async createScholar(data: Prisma.PostSelectionRecordCreateInput): Promise<PostSelectionRecord> {
    return this.prisma.postSelectionRecord.create({
      data,
    });
  }

  /**
   * Update a post-selection scholar record.
   */
  async updateScholar(
    id: string,
    data: Prisma.PostSelectionRecordUpdateInput
  ): Promise<PostSelectionRecord> {
    return this.prisma.postSelectionRecord.update({
      where: { id },
      data,
    });
  }

  /**
   * List renewals with filters and pagination.
   */
  async findRenewals(
    filters: RenewalFilterParams,
    scope?: { applicantProfileId?: string }
  ): Promise<{ renewals: any[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ScholarRenewalWhereInput = {};

    const psWhere: Prisma.PostSelectionRecordWhereInput = {};

    if (scope?.applicantProfileId) {
      psWhere.applicantProfileId = scope.applicantProfileId;
    }

    if (filters.schemeCode) {
      psWhere.schemeVersion = {
        scheme: {
          code: { equals: filters.schemeCode, mode: "insensitive" },
        },
      };
    }

    if (Object.keys(psWhere).length > 0) {
      where.postSelectionRecord = { is: psWhere };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.academicYear) {
      where.academicYear = filters.academicYear;
    }

    const [records, total] = await Promise.all([
      this.prisma.scholarRenewal.findMany({
        where,
        include: {
          postSelectionRecord: {
            include: {
              applicantProfile: {
                include: {
                  user: { select: { id: true, name: true, email: true } },
                },
              },
              schemeVersion: {
                include: { scheme: true },
              },
              caseDossier: {
                select: { caseNumber: true },
              },
            },
          },
          reviewedBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
        skip,
        take: limit,
      }),
      this.prisma.scholarRenewal.count({ where }),
    ]);

    return { renewals: records, total };
  }

  /**
   * Find renewal by ID.
   */
  async findRenewalById(id: string) {
    return this.prisma.scholarRenewal.findUnique({
      where: { id },
      include: {
        postSelectionRecord: {
          include: {
            applicantProfile: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
            schemeVersion: {
              include: { scheme: true },
            },
            caseDossier: {
              select: { id: true, caseNumber: true },
            },
          },
        },
        reviewedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Create renewal record.
   */
  async createRenewal(data: Prisma.ScholarRenewalCreateInput): Promise<ScholarRenewal> {
    return this.prisma.scholarRenewal.create({
      data,
    });
  }

  /**
   * Update renewal record.
   */
  async updateRenewal(id: string, data: Prisma.ScholarRenewalUpdateInput): Promise<ScholarRenewal> {
    return this.prisma.scholarRenewal.update({
      where: { id },
      data,
    });
  }

  /**
   * List disbursements with filters.
   */
  async findDisbursements(
    filters: DisbursementFilterParams,
    scope?: { applicantProfileId?: string }
  ): Promise<{ disbursements: any[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.DisbursementRecordWhereInput = {};

    if (filters.scholarId) {
      where.postSelectionRecordId = filters.scholarId;
    }

    const psWhere: Prisma.PostSelectionRecordWhereInput = {};

    if (scope?.applicantProfileId) {
      psWhere.applicantProfileId = scope.applicantProfileId;
    }

    if (filters.schemeCode) {
      psWhere.schemeVersion = {
        scheme: {
          code: { equals: filters.schemeCode, mode: "insensitive" },
        },
      };
    }

    if (Object.keys(psWhere).length > 0) {
      where.postSelectionRecord = { is: psWhere };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.financialYear) {
      where.financialYear = filters.financialYear;
    }

    const [records, total] = await Promise.all([
      this.prisma.disbursementRecord.findMany({
        where,
        include: {
          postSelectionRecord: {
            include: {
              applicantProfile: {
                include: {
                  user: { select: { id: true, name: true, email: true } },
                },
              },
              schemeVersion: {
                include: { scheme: true },
              },
              caseDossier: {
                select: { caseNumber: true },
              },
            },
          },
        },
        orderBy: [{ installmentNumber: "asc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      this.prisma.disbursementRecord.count({ where }),
    ]);

    return { disbursements: records, total };
  }

  /**
   * Find disbursement by ID.
   */
  async findDisbursementById(id: string) {
    return this.prisma.disbursementRecord.findUnique({
      where: { id },
      include: {
        postSelectionRecord: {
          include: {
            applicantProfile: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
            schemeVersion: {
              include: { scheme: true },
            },
            caseDossier: {
              select: { id: true, caseNumber: true },
            },
          },
        },
      },
    });
  }

  /**
   * Create disbursement.
   */
  async createDisbursement(
    data: Prisma.DisbursementRecordCreateInput
  ): Promise<DisbursementRecord> {
    return this.prisma.disbursementRecord.create({
      data,
    });
  }

  /**
   * Update disbursement.
   */
  async updateDisbursement(
    id: string,
    data: Prisma.DisbursementRecordUpdateInput
  ): Promise<DisbursementRecord> {
    return this.prisma.disbursementRecord.update({
      where: { id },
      data,
    });
  }

  /**
   * Aggregate live database metrics for the Post-Selection Dashboard.
   */
  async getMetrics(): Promise<PostSelectionMetricsDTO> {
    const [allScholars, allRenewals, allDisbursements, schemeDistributions] = await Promise.all([
      this.prisma.postSelectionRecord.findMany({
        select: {
          id: true,
          scholarStatus: true,
          disbursementStatus: true,
          awardedAmount: true,
          schemeVersion: {
            select: {
              scheme: {
                select: { code: true, name: true },
              },
            },
          },
        },
      }),
      this.prisma.scholarRenewal.findMany({
        select: { status: true },
      }),
      this.prisma.disbursementRecord.findMany({
        select: { status: true, amount: true },
      }),
      this.prisma.scheme.findMany({
        select: {
          code: true,
          name: true,
          versions: {
            select: {
              postSelectionRecords: {
                select: { id: true, scholarStatus: true },
              },
            },
          },
        },
      }),
    ]);

    const totalScholars = allScholars.length;
    const activeScholars = allScholars.filter(
      (s) => s.scholarStatus === ScholarStatus.ACTIVE
    ).length;
    const onHoldScholars = allScholars.filter(
      (s) => s.scholarStatus === ScholarStatus.ON_HOLD
    ).length;
    const completedScholars = allScholars.filter(
      (s) => s.scholarStatus === ScholarStatus.COMPLETED
    ).length;

    const renewalsDue = allRenewals.filter(
      (r) => r.status === RenewalStatus.UPCOMING || r.status === RenewalStatus.DRAFT
    ).length;
    const renewalsUnderReview = allRenewals.filter(
      (r) => r.status === RenewalStatus.SUBMITTED || r.status === RenewalStatus.UNDER_REVIEW
    ).length;
    const deficientRenewals = allRenewals.filter(
      (r) => r.status === RenewalStatus.DEFICIENT
    ).length;
    const approvedRenewals = allRenewals.filter((r) => r.status === RenewalStatus.APPROVED).length;

    const totalAwardedAmount = allScholars.reduce(
      (sum, s) => sum + Number(s.awardedAmount || 0),
      0
    );

    const totalDisbursedAmount = allDisbursements
      .filter((d) => d.status === DisbursementRecordStatus.PAID)
      .reduce((sum, d) => sum + Number(d.amount || 0), 0);

    const pendingDisbursementAmount = allDisbursements
      .filter(
        (d) =>
          d.status === DisbursementRecordStatus.PENDING ||
          d.status === DisbursementRecordStatus.PROCESSING
      )
      .reduce((sum, d) => sum + Number(d.amount || 0), 0);

    const schemeDistribution = schemeDistributions.map((sch) => {
      const allRecords = sch.versions.flatMap((v) => v.postSelectionRecords);
      return {
        schemeCode: sch.code,
        schemeName: sch.name,
        scholarCount: allRecords.length,
        activeCount: allRecords.filter((r) => r.scholarStatus === ScholarStatus.ACTIVE).length,
      };
    });

    const disbursementStatusBreakdown: Record<string, number> = {};
    for (const d of allDisbursements) {
      disbursementStatusBreakdown[d.status] = (disbursementStatusBreakdown[d.status] || 0) + 1;
    }

    const renewalStatusBreakdown: Record<string, number> = {};
    for (const r of allRenewals) {
      renewalStatusBreakdown[r.status] = (renewalStatusBreakdown[r.status] || 0) + 1;
    }

    return {
      totalScholars,
      activeScholars,
      onHoldScholars,
      completedScholars,
      renewalsDue,
      renewalsUnderReview,
      deficientRenewals,
      approvedRenewals,
      totalAwardedAmount,
      totalDisbursedAmount,
      pendingDisbursementAmount,
      schemeDistribution,
      disbursementStatusBreakdown,
      renewalStatusBreakdown,
    };
  }
}

export const postSelectionRepository = new PostSelectionRepository(defaultPrisma);
