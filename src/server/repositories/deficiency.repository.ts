import { prisma } from "../db";
import { Deficiency, DeficiencyStatus, Prisma } from "@prisma/client";

export class DeficiencyRepository {
  async listByCaseId(caseDossierId: string, status?: DeficiencyStatus): Promise<Deficiency[]> {
    return prisma.deficiency.findMany({
      where: {
        caseDossierId,
        ...(status ? { status } : {}),
      },
      include: {
        issuedBy: { select: { id: true, name: true, email: true, role: true } },
        targetDocument: true,
        resolutionDocuments: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findById(id: string): Promise<Deficiency | null> {
    return prisma.deficiency.findUnique({
      where: { id },
      include: {
        issuedBy: true,
        targetDocument: true,
        resolutionDocuments: true,
        caseDossier: true,
      },
    });
  }

  async create(data: Prisma.DeficiencyCreateInput): Promise<Deficiency> {
    return prisma.deficiency.create({ data });
  }

  async resolve(
    deficiencyId: string,
    resolvingDocumentId: string,
    officerRemark?: string
  ): Promise<Deficiency> {
    return prisma.deficiency.update({
      where: { id: deficiencyId },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        recheckStatus: "PENDING_RECHECK",
        officerResolutionRemark: officerRemark,
        resolutionDocuments: {
          connect: { id: resolvingDocumentId },
        },
      },
    });
  }
}

export const deficiencyRepository = new DeficiencyRepository();
