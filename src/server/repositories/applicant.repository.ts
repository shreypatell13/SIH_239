import { prisma } from "../db";
import { ApplicantProfile, Prisma } from "@prisma/client";

export class ApplicantRepository {
  async findByUserId(userId: string): Promise<ApplicantProfile | null> {
    return prisma.applicantProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        applications: {
          include: {
            caseDossier: true,
            schemeVersion: { include: { scheme: true } },
          },
        },
      },
    });
  }

  async findById(id: string): Promise<ApplicantProfile | null> {
    return prisma.applicantProfile.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  async create(data: Prisma.ApplicantProfileCreateInput): Promise<ApplicantProfile> {
    return prisma.applicantProfile.create({ data });
  }

  async update(
    userId: string,
    data: Prisma.ApplicantProfileUpdateInput
  ): Promise<ApplicantProfile> {
    return prisma.applicantProfile.update({
      where: { userId },
      data,
    });
  }

  async upsert(
    userId: string,
    data: Omit<Prisma.ApplicantProfileCreateInput, "user">
  ): Promise<ApplicantProfile> {
    return prisma.applicantProfile.upsert({
      where: { userId },
      update: data,
      create: {
        ...data,
        user: { connect: { id: userId } },
      },
    });
  }
}

export const applicantRepository = new ApplicantRepository();
