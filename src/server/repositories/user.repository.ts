import { prisma } from "../db";
import { User, UserRole, Prisma } from "@prisma/client";

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
  }

  async listByRole(role: UserRole): Promise<User[]> {
    return prisma.user.findMany({
      where: { role, isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  async upsertDemoUser(user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  }): Promise<User> {
    return prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role, isActive: true },
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: true,
      },
    });
  }
}

export const userRepository = new UserRepository();
