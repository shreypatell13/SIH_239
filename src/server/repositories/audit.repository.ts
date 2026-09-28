import { prisma } from "../db";
import { AuditLog, Prisma } from "@prisma/client";

export class AuditRepository {
  async log(data: Prisma.AuditLogUncheckedCreateInput): Promise<AuditLog> {
    return prisma.auditLog.create({ data });
  }

  async create(data: Prisma.AuditLogUncheckedCreateInput): Promise<AuditLog> {
    return prisma.auditLog.create({ data });
  }

  async listByCaseId(caseDossierId: string): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: { caseDossierId },
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async listRecentEvents(limit: number = 50): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      take: limit,
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const auditRepository = new AuditRepository();
