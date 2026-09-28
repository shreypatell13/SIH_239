import { prisma } from "../db";
import { Scheme, SchemeVersion, Prisma } from "@prisma/client";
import { PublishSchemeVersionDTO } from "../domain/scheme/types";

export type SchemeWithVersions = Scheme & {
  versions: SchemeVersion[];
};

export class SchemeRepository {
  async findByCode(code: string): Promise<SchemeWithVersions | null> {
    return prisma.scheme.findUnique({
      where: { code },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
        },
      },
    });
  }

  async findById(id: string): Promise<SchemeWithVersions | null> {
    return prisma.scheme.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          include: {
            publishedBy: {
              select: { id: true, name: true, email: true },
            },
            _count: {
              select: { applications: true },
            },
          },
        },
      },
    });
  }

  async getActiveVersion(schemeCode: string): Promise<(SchemeVersion & { scheme: Scheme }) | null> {
    const version = await prisma.schemeVersion.findFirst({
      where: {
        scheme: { code: schemeCode },
        isActive: true,
      },
      include: {
        scheme: true,
      },
      orderBy: { versionNumber: "desc" },
    });
    return version;
  }

  async findVersionById(versionId: string): Promise<
    | (SchemeVersion & {
        scheme: Scheme;
        publishedBy?: { id: string; name: string | null; email: string } | null;
      })
    | null
  > {
    return prisma.schemeVersion.findUnique({
      where: { id: versionId },
      include: {
        scheme: true,
        publishedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async listActiveSchemes(): Promise<SchemeWithVersions[]> {
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

  async listAllSchemes(): Promise<SchemeWithVersions[]> {
    return prisma.scheme.findMany({
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          include: {
            publishedBy: {
              select: { id: true, name: true, email: true },
            },
            _count: {
              select: { applications: true },
            },
          },
        },
      },
      orderBy: { code: "asc" },
    });
  }

  async listVersions(schemeId: string): Promise<
    (SchemeVersion & {
      publishedBy?: { id: string; name: string | null; email: string } | null;
      _count: { applications: number };
    })[]
  > {
    return prisma.schemeVersion.findMany({
      where: { schemeId },
      orderBy: { versionNumber: "desc" },
      include: {
        publishedBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { applications: true },
        },
      },
    });
  }

  async createScheme(data: Prisma.SchemeCreateInput): Promise<Scheme> {
    return prisma.scheme.create({ data });
  }

  /**
   * Atomically supersedes previous active version and creates a newly activated SchemeVersion.
   * Also writes immutable AuditLog records in the same transaction.
   */
  async publishNewVersion(
    schemeId: string,
    config: PublishSchemeVersionDTO,
    publishedById: string
  ): Promise<SchemeVersion> {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch existing versions to compute next version number and identify active version
      const existingVersions = await tx.schemeVersion.findMany({
        where: { schemeId },
        orderBy: { versionNumber: "desc" },
      });

      const maxVersion = existingVersions.length > 0 ? existingVersions[0].versionNumber : 0;
      const nextVersionNumber = maxVersion + 1;
      const activeVersion = existingVersions.find((v) => v.isActive);

      const now = new Date();

      // 2. Deactivate currently active version if one exists
      if (activeVersion) {
        await tx.schemeVersion.update({
          where: { id: activeVersion.id },
          data: {
            isActive: false,
            effectiveTo: now,
          },
        });

        // Audit log supersession
        await tx.auditLog.create({
          data: {
            actorId: publishedById,
            actionType: "SCHEME_VERSION_SUPERSEDED",
            payload: {
              schemeId,
              supersededVersionId: activeVersion.id,
              supersededVersionNumber: activeVersion.versionNumber,
              effectiveTo: now.toISOString(),
            },
          },
        });
      }

      // 3. Create the new SchemeVersion
      const newVersion = await tx.schemeVersion.create({
        data: {
          schemeId,
          versionNumber: nextVersionNumber,
          effectiveFrom: now,
          effectiveTo: null,
          isActive: true,
          publishedById,
          publishedAt: now,
          formSchema: config.formSchema as unknown as Prisma.InputJsonValue,
          documentRequirements: config.documentRequirements as unknown as Prisma.InputJsonValue,
          eligibilityRules: config.eligibilityRules as unknown as Prisma.InputJsonValue,
          workflowConfig: config.workflowConfig
            ? (config.workflowConfig as unknown as Prisma.InputJsonValue)
            : Prisma.DbNull,
          selectionConfig: config.selectionConfig
            ? (config.selectionConfig as unknown as Prisma.InputJsonValue)
            : Prisma.DbNull,
          applicationOpenDate: config.applicationOpenDate
            ? new Date(config.applicationOpenDate)
            : null,
          applicationDeadline: config.applicationDeadline
            ? new Date(config.applicationDeadline)
            : null,
        },
      });

      // 4. Audit log publication
      await tx.auditLog.create({
        data: {
          actorId: publishedById,
          actionType: "SCHEME_VERSION_PUBLISHED",
          payload: {
            schemeId,
            versionId: newVersion.id,
            versionNumber: newVersion.versionNumber,
            supersededVersionId: activeVersion?.id ?? null,
            publishedAt: now.toISOString(),
          },
        },
      });

      return newVersion;
    });
  }
}

export const schemeRepository = new SchemeRepository();
