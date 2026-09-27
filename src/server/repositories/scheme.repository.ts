import { prisma } from "../db";
import { Scheme, SchemeVersion, Prisma } from "@prisma/client";

export class SchemeRepository {
  async findByCode(code: string): Promise<(Scheme & { versions: SchemeVersion[] }) | null> {
    return prisma.scheme.findUnique({
      where: { code },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
        },
      },
    });
  }

  async getActiveVersion(schemeCode: string): Promise<SchemeVersion | null> {
    const scheme = await prisma.scheme.findUnique({
      where: { code: schemeCode },
      include: {
        versions: {
          where: { isActive: true },
          take: 1,
          orderBy: { versionNumber: "desc" },
        },
      },
    });
    return scheme?.versions[0] ?? null;
  }

  async listActiveSchemes(): Promise<(Scheme & { versions: SchemeVersion[] })[]> {
    return prisma.scheme.findMany({
      where: { isActive: true },
      include: {
        versions: {
          where: { isActive: true },
          take: 1,
          orderBy: { versionNumber: "desc" },
        },
      },
      orderBy: { code: "asc" },
    });
  }

  async createScheme(data: Prisma.SchemeCreateInput): Promise<Scheme> {
    return prisma.scheme.create({ data });
  }

  async createVersion(data: Prisma.SchemeVersionCreateInput): Promise<SchemeVersion> {
    return prisma.schemeVersion.create({ data });
  }
}

export const schemeRepository = new SchemeRepository();
