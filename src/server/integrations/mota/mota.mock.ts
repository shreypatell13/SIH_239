import {
  IMotaAdapter,
  MotaQuotaSyncRequest,
  MotaQuotaSyncResponse,
  MotaSanctionNotificationRequest,
  MotaSanctionNotificationResponse,
} from "./mota.interface";
import { IntegrationHealth } from "../core/types";
import { syntheticToken } from "../core/synthetic-id";
import { IntegrationUnavailableError, IntegrationValidationError } from "../core/errors";

export class MockMotaAdapter implements IMotaAdapter {
  private readonly providerId = "mota";
  private isAvailable = true;

  public setAvailability(available: boolean): void {
    this.isAvailable = available;
  }

  async checkHealth(): Promise<IntegrationHealth> {
    return {
      providerId: this.providerId,
      providerName: "Ministry of Tribal Affairs Central Portal (MoTA Gateway)",
      mode: "MOCK",
      status: this.isAvailable ? "MOCK" : "UNAVAILABLE",
      message: this.isAvailable
        ? "Mock MoTA Adapter active (central slot quota sync & sanction notifications)"
        : "Mock MoTA Adapter is set to simulated unavailable state",
      lastChecked: new Date().toISOString(),
      latencyMs: 10,
      capabilities: [
        "national_quota_sync",
        "parliamentary_reporting_feed",
        "ministry_sanction_notification",
      ],
    };
  }

  async syncQuota(request: MotaQuotaSyncRequest): Promise<MotaQuotaSyncResponse> {
    if (!this.isAvailable) {
      throw new IntegrationUnavailableError(this.providerId, "MoTA Central Gateway unreachable");
    }

    if (!request.schemeCode) {
      throw new IntegrationValidationError(this.providerId, "Scheme code is required");
    }

    return {
      syncId: `SYNC-MOTA-${syntheticToken(`${request.schemeCode}|${request.fiscalYear}|${request.totalSlots}|${request.utilizedSlots}`, 10)}`,
      schemeCode: request.schemeCode,
      acknowledged: true,
      motaReferenceNumber: `MOTA/SCHEME/${request.schemeCode.toUpperCase()}/${request.fiscalYear}`,
      syncedAt: new Date().toISOString(),
      source: "MOTA_MOCK_ADAPTER",
    };
  }

  async notifySanction(
    request: MotaSanctionNotificationRequest
  ): Promise<MotaSanctionNotificationResponse> {
    if (!this.isAvailable) {
      throw new IntegrationUnavailableError(this.providerId, "MoTA Central Gateway unreachable");
    }

    return {
      notificationId: `NOTIF-MOTA-${syntheticToken(`${request.schemeCode}|${request.sanctionOrderNumber}|${request.fellowshipCategory}|${request.awardedAmountInr}`, 10)}`,
      status: "RECORDED",
      recordedAt: new Date().toISOString(),
      source: "MOTA_MOCK_ADAPTER",
    };
  }
}
