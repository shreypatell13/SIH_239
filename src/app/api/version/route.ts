import { apiSuccess } from "@/server/api-response";

export async function GET() {
  return apiSuccess({
    name: "TribalScholar AI",
    problemStatement:
      "26239 — AI-Enabled Scholarship and Fellowship Management System for Scheduled Tribes",
    version: "0.1.0-phase2a",
    phase: "Phase 2A: Engineering Foundation & Monorepo Tooling",
    architecture: "Next.js 14 App Router + TypeScript + Prisma ORM + PostgreSQL",
    supportedSchemes: ["NFST", "NOS"],
    buildMode: process.env.NODE_ENV || "development",
  });
}
