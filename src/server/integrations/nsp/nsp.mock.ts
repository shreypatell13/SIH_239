import {
  INspAdapter,
  NspDeduplicationRequest,
  NspDeduplicationResponse,
  NspScholarRegistrationRequest,
  NspScholarRegistrationResponse,
} from "./nsp.interface";
import { IntegrationHealth } from "../core/types";
import {
  IntegrationTimeoutError,
  IntegrationUnavailableError,
  IntegrationValidationError,
} from "../core/errors";

export class MockNspAdapter implements INspAdapter {
  private readonly providerId = "nsp";
  private isAvailable = true;

  public setAvailability(available: boolean): void {
    this.isAvailable = available;
  }

  async checkHealth(): Promise<IntegrationHealth> {
    return {
      providerId: this.providerId,
      providerName: "National Scholarship Portal (NSP Deduplication Gateway)",
      mode: "MOCK",
      status: this.isAvailable ? "MOCK" : "UNAVAILABLE",
      message: this.isAvailable
        ? "Mock NSP Adapter active (synthetic cross-ministry de-duplication registry)"
        : "Mock NSP Adapter is set to simulated unavailable state",
      lastChecked: new Date().toISOString(),
      latencyMs: 15,
      capabilities: [
        "cross_scheme_deduplication",
        "state_central_scholarship_check",
        "beneficiary_aadhaar_seeding_check",
      ],
    };
  }

  async checkDeduplication(request: NspDeduplicationRequest): Promise<NspDeduplicationResponse> {
    if (!this.isAvailable) {
      throw new IntegrationUnavailableError(
        this.providerId,
        "NSP De-duplication service is currently unreachable"
      );
    }

    if (!request.candidateName || request.candidateName.trim() === "") {
      throw new IntegrationValidationError(this.providerId, "Candidate name is required");
    }

    if (request.candidateName.includes("SIMULATE_TIMEOUT")) {
      throw new IntegrationTimeoutError(this.providerId, 6000);
    }
    if (request.candidateName.includes("SIMULATE_UNAVAILABLE")) {
      throw new IntegrationUnavailableError(this.providerId, "Simulated upstream NSP outage");
    }

    // Flag duplicate award if simulated with trigger keyword
    const isSimulatedDuplicate = request.candidateName.includes("SIMULATE_DUPLICATE");

    if (isSimulatedDuplicate) {
      return {
        hasDuplicateAward: true,
        deDupStatus: "FLAGGED",
        duplicateRecords: [
          {
            schemeName: "Post-Matric Scholarship for ST Students (State Component)",
            academicYear: request.academicYear || "2024-25",
            awardingBody: "State Tribal Welfare Department",
            sanctionDate: "2024-01-15",
            amountInr: 45000,
          },
        ],
        checkedAt: new Date().toISOString(),
        source: "NSP_MOCK_ADAPTER",
      };
    }

    return {
      hasDuplicateAward: false,
      deDupStatus: "CLEARED",
      checkedAt: new Date().toISOString(),
      source: "NSP_MOCK_ADAPTER",
    };
  }

  async registerScholar(
    request: NspScholarRegistrationRequest
  ): Promise<NspScholarRegistrationResponse> {
    if (!this.isAvailable) {
      throw new IntegrationUnavailableError(this.providerId, "NSP Gateway unavailable");
    }

    const cleanScheme = request.schemeCode.toUpperCase();
    const appId = `NSP-${cleanScheme}-${Date.now().toString().slice(-6)}`;

    return {
      nspApplicationId: appId,
      status: "REGISTERED",
      registrationDate: new Date().toISOString(),
      source: "NSP_MOCK_ADAPTER",
    };
  }
}
