import { prisma } from "@/server/db";
import { apiSuccess } from "@/server/api-response";

export async function GET() {
  let dbStatus = "disconnected";
  try {
    // Run lightweight check
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (err) {
    dbStatus = `unavailable (${err instanceof Error ? err.message : "connection error"})`;
  }

  return apiSuccess({
    status: dbStatus === "connected" ? "healthy" : "degraded",
    service: "TribalScholar AI API",
    database: dbStatus,
    storage: "local-filesystem-active",
    environment: process.env.NODE_ENV || "development",
    uptimeSeconds: Math.floor(process.uptime()),
  });
}
