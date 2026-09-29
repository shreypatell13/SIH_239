import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/server/auth/session";
import { integrationService } from "@/server/services/integration.service";
import { apiError, apiSuccess } from "@/server/api-response";

/**
 * GET /api/integrations/health
 * Returns real-time health and operational status of all external system adapters.
 * Protected: Requires authenticated session.
 */
export async function GET() {
  try {
    const user = await getServerAuthUser();
    if (!user) {
      return apiError("Unauthorized: Authentication required", "UNAUTHORIZED", 401);
    }

    const health = await integrationService.getSystemHealth();
    return apiSuccess(health, 200);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to retrieve integration health";
    return apiError(msg, "INTEGRATION_HEALTH_ERROR", 500);
  }
}
