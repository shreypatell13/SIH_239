/**
 * Integration Adapter Core Types
 * Phase 2L: Integration Adapters & Security Hardening
 *
 * Defines standardized health, provider status, and operational contracts
 * for external government system boundaries (DigiLocker, PFMS, NSP, MoTA).
 */

export type IntegrationProviderStatus =
  "CONFIGURED" | "AVAILABLE" | "UNAVAILABLE" | "MOCK" | "ERROR";

export type IntegrationMode = "MOCK" | "LIVE";

export interface IntegrationHealth {
  providerId: string;
  providerName: string;
  mode: IntegrationMode;
  status: IntegrationProviderStatus;
  message: string;
  lastChecked: string;
  latencyMs?: number;
  capabilities: string[];
}

export interface SystemIntegrationsHealthSummary {
  overallStatus: "HEALTHY" | "DEGRADED" | "CRITICAL";
  mode: IntegrationMode;
  timestamp: string;
  providers: IntegrationHealth[];
}
