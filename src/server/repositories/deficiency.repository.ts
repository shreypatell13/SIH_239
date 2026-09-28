/**
 * Deficiency Repository
 * Phase 2H: Deficiency Management & Targeted Recheck Engine
 */

import { prisma } from "../db";
import {
  Deficiency,
  DeficiencyStatus,
  DeficiencyType,
  DocumentType,
  RecheckStatus,
  Prisma,
} from "@prisma/client";

export class DeficiencyRepository {
  /**
   * Lists deficiencies for a given case dossier.
   */
  async listByCaseId(
    caseDossierId: string,
    status?: DeficiencyStatus
  ): Promise<
    Array<
      Deficiency & {
        issuedBy: { id: string; name: string | null; email: string; role: any };
        targetDocument: any;
        resolutionDocuments: any[];
        ruleResult: any;
      }
    >
  > {
    return prisma.deficiency.findMany({
      where: {
        caseDossierId,
        ...(status ? { status } : {}),
      },
      include: {
        issuedBy: { select: { id: true, name: true, email: true, role: true } },
        targetDocument: true,
        resolutionDocuments: {
          orderBy: { version: "desc" },
        },
        ruleResult: true,
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
  }

  /**
   * Retrieves a single deficiency by its primary ID with full relations.
   */
  async findById(id: string) {
    return prisma.deficiency.findUnique({
      where: { id },
      include: {
        issuedBy: { select: { id: true, name: true, email: true, role: true } },
        targetDocument: true,
        resolutionDocuments: {
          orderBy: { version: "desc" },
        },
        ruleResult: true,
        caseDossier: {
          include: {
            application: {
              include: {
                applicantProfile: true,
                schemeVersion: { include: { scheme: true } },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Finds an existing OPEN deficiency for deduplication.
   */
  async findOpenExisting(params: {
    caseDossierId: string;
    deficiencyType: DeficiencyType;
    documentType?: DocumentType | null;
    targetDocumentId?: string | null;
    ruleResultId?: string | null;
  }): Promise<Deficiency | null> {
    const { caseDossierId, deficiencyType, documentType, targetDocumentId, ruleResultId } = params;

    return prisma.deficiency.findFirst({
      where: {
        caseDossierId,
        status: DeficiencyStatus.OPEN,
        deficiencyType,
        ...(documentType ? { documentType } : {}),
        ...(targetDocumentId ? { targetDocumentId } : {}),
        ...(ruleResultId ? { ruleResultId } : {}),
      },
    });
  }

  /**
   * Creates a single deficiency record.
   */
  async create(data: Prisma.DeficiencyCreateInput): Promise<Deficiency> {
    return prisma.deficiency.create({
      data,
      include: {
        issuedBy: { select: { id: true, name: true, email: true, role: true } },
        targetDocument: true,
      },
    });
  }

  /**
   * Records an applicant response / remedy submission.
   */
  async recordApplicantResponse(
    id: string,
    params: {
      clarificationText?: string;
      resolvingDocumentId?: string;
    }
  ): Promise<Deficiency> {
    const { clarificationText, resolvingDocumentId } = params;

    return prisma.deficiency.update({
      where: { id },
      data: {
        applicantResponseText: clarificationText?.trim() || null,
        applicantRespondedAt: new Date(),
        recheckStatus: RecheckStatus.PENDING_RECHECK,
        recheckAt: new Date(),
        ...(resolvingDocumentId
          ? {
              resolutionDocuments: {
                connect: { id: resolvingDocumentId },
              },
            }
          : {}),
      },
      include: {
        targetDocument: true,
        resolutionDocuments: true,
      },
    });
  }

  /**
   * Updates deficiency lifecycle status (resolved, waived, reopened, etc.)
   */
  async updateStatus(
    id: string,
    params: {
      status: DeficiencyStatus;
      recheckStatus?: RecheckStatus | null;
      officerResolutionRemark?: string | null;
      resolvedAt?: Date | null;
      recheckAt?: Date | null;
    }
  ): Promise<Deficiency> {
    const { status, recheckStatus, officerResolutionRemark, resolvedAt, recheckAt } = params;

    return prisma.deficiency.update({
      where: { id },
      data: {
        status,
        ...(recheckStatus !== undefined ? { recheckStatus } : {}),
        ...(officerResolutionRemark !== undefined ? { officerResolutionRemark } : {}),
        ...(recheckAt !== undefined ? { recheckAt } : {}),
        resolvedAt: status === DeficiencyStatus.RESOLVED ? resolvedAt || new Date() : null,
      },
    });
  }

  /**
   * Retrieves deficiency count metrics for summary generation.
   */
  async countMetrics(caseDossierId: string): Promise<{
    total: number;
    open: number;
    resolved: number;
    waived: number;
    expired: number;
  }> {
    const counts = await prisma.deficiency.groupBy({
      by: ["status"],
      where: { caseDossierId },
      _count: { _all: true },
    });

    let total = 0;
    let open = 0;
    let resolved = 0;
    let waived = 0;
    let expired = 0;

    for (const c of counts) {
      total += c._count._all;
      if (c.status === "OPEN") open += c._count._all;
      else if (c.status === "RESOLVED") resolved += c._count._all;
      else if (c.status === "WAIVED") waived += c._count._all;
      else if (c.status === "EXPIRED") expired += c._count._all;
    }

    return { total, open, resolved, waived, expired };
  }
}

export const deficiencyRepository = new DeficiencyRepository();
