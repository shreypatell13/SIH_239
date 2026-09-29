import { IntegrationHealth } from "../core/types";

export interface MotaQuotaSyncRequest {
  schemeCode: string;
  fiscalYear: string;
  totalSlots: number;
  utilizedSlots: number;
}

export interface MotaQuotaSyncResponse {
  syncId: string;
  schemeCode: string;
  acknowledged: boolean;
  motaReferenceNumber: string;
  syncedAt: string;
  source: "MOTA_MOCK_ADAPTER" | "MOTA_PRODUCTION";
}

export interface MotaSanctionNotificationRequest {
  schemeCode: string;
  applicantAadhaarVaultRef?: string;
  sanctionOrderNumber: string;
  fellowshipCategory: "NFST" | "NOS";
  awardedAmountInr: number;
}

export interface MotaSanctionNotificationResponse {
  notificationId: string;
  status: "RECORDED" | "QUEUED";
  recordedAt: string;
  source: "MOTA_MOCK_ADAPTER" | "MOTA_PRODUCTION";
}

export interface IMotaAdapter {
  syncQuota(request: MotaQuotaSyncRequest): Promise<MotaQuotaSyncResponse>;
  notifySanction(
    request: MotaSanctionNotificationRequest
  ): Promise<MotaSanctionNotificationResponse>;
  checkHealth(): Promise<IntegrationHealth>;
}
