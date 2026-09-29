/**
 * Integration Registry
 * Phase 2L: Integration Adapters & Security Hardening
 *
 * Centralized singleton registry managing external adapter instances,
 * health status reporting, and safe integration boundaries.
 */

import { IDigiLockerAdapter } from "./digilocker/digilocker.interface";
import { MockDigiLockerAdapter } from "./digilocker/digilocker.mock";
import { IPfmsAdapter } from "./pfms/pfms.interface";
import { MockPfmsAdapter } from "./pfms/pfms.mock";
import { INspAdapter } from "./nsp/nsp.interface";
import { MockNspAdapter } from "./nsp/nsp.mock";
import { IMotaAdapter } from "./mota/mota.interface";
import { MockMotaAdapter } from "./mota/mota.mock";
import { SystemIntegrationsHealthSummary, IntegrationHealth } from "./core/types";

export class IntegrationRegistry {
  private digiLockerAdapter: IDigiLockerAdapter;
  private pfmsAdapter: IPfmsAdapter;
  private nspAdapter: INspAdapter;
  private motaAdapter: IMotaAdapter;

  constructor() {
    // Default to isolated, safe mock adapters
    this.digiLockerAdapter = new MockDigiLockerAdapter();
    this.pfmsAdapter = new MockPfmsAdapter();
    this.nspAdapter = new MockNspAdapter();
    this.motaAdapter = new MockMotaAdapter();
  }

  public getDigiLocker(): IDigiLockerAdapter {
    return this.digiLockerAdapter;
  }

  public getPfms(): IPfmsAdapter {
    return this.pfmsAdapter;
  }

  public getNsp(): INspAdapter {
    return this.nspAdapter;
  }

  public getMota(): IMotaAdapter {
    return this.motaAdapter;
  }

  /**
   * Set custom adapter implementations (e.g. for testing or future verified providers)
   */
  public setDigiLockerAdapter(adapter: IDigiLockerAdapter): void {
    this.digiLockerAdapter = adapter;
  }

  public setPfmsAdapter(adapter: IPfmsAdapter): void {
    this.pfmsAdapter = adapter;
  }

  public setNspAdapter(adapter: INspAdapter): void {
    this.nspAdapter = adapter;
  }

  public setMotaAdapter(adapter: IMotaAdapter): void {
    this.motaAdapter = adapter;
  }

  /**
   * Aggregates live health status across all configured integration adapters.
   * Never exposes credentials, secret keys, or raw provider payload signatures.
   */
  async getSystemHealth(): Promise<SystemIntegrationsHealthSummary> {
    const checks: IntegrationHealth[] = await Promise.all([
      this.digiLockerAdapter.checkHealth().catch((err: Error) => ({
        providerId: "digilocker",
        providerName: "DigiLocker National Document Gateway",
        mode: "MOCK" as const,
        status: "ERROR" as const,
        message: err.message || "Health check failed",
        lastChecked: new Date().toISOString(),
        capabilities: [],
      })),
      this.pfmsAdapter.checkHealth().catch((err: Error) => ({
        providerId: "pfms",
        providerName: "Public Financial Management System (PFMS)",
        mode: "MOCK" as const,
        status: "ERROR" as const,
        message: err.message || "Health check failed",
        lastChecked: new Date().toISOString(),
        capabilities: [],
      })),
      this.nspAdapter.checkHealth().catch((err: Error) => ({
        providerId: "nsp",
        providerName: "National Scholarship Portal (NSP)",
        mode: "MOCK" as const,
        status: "ERROR" as const,
        message: err.message || "Health check failed",
        lastChecked: new Date().toISOString(),
        capabilities: [],
      })),
      this.motaAdapter.checkHealth().catch((err: Error) => ({
        providerId: "mota",
        providerName: "Ministry of Tribal Affairs Central Gateway",
        mode: "MOCK" as const,
        status: "ERROR" as const,
        message: err.message || "Health check failed",
        lastChecked: new Date().toISOString(),
        capabilities: [],
      })),
    ]);

    const hasError = checks.some((c) => c.status === "ERROR");
    const hasUnavailable = checks.some((c) => c.status === "UNAVAILABLE");

    let overallStatus: "HEALTHY" | "DEGRADED" | "CRITICAL" = "HEALTHY";
    if (hasError) overallStatus = "CRITICAL";
    else if (hasUnavailable) overallStatus = "DEGRADED";

    return {
      overallStatus,
      mode: "MOCK",
      timestamp: new Date().toISOString(),
      providers: checks,
    };
  }
}

export const integrationRegistry = new IntegrationRegistry();
