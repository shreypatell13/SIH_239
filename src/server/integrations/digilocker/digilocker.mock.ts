import {
  IDigiLockerAdapter,
  DigiLockerVerifyRequest,
  DigiLockerVerifyResponse,
  DigiLockerDocMetadata,
} from "./digilocker.interface";
import { IntegrationHealth } from "../core/types";
import {
  IntegrationTimeoutError,
  IntegrationUnavailableError,
  IntegrationValidationError,
  IntegrationAuthError,
  IntegrationMalformedResponseError,
} from "../core/errors";

export class MockDigiLockerAdapter implements IDigiLockerAdapter {
  private readonly providerId = "digilocker";
  private isAvailable = true;

  public setAvailability(available: boolean): void {
    this.isAvailable = available;
  }

  async checkHealth(): Promise<IntegrationHealth> {
    return {
      providerId: this.providerId,
      providerName: "DigiLocker National Document Gateway",
      mode: "MOCK",
      status: this.isAvailable ? "MOCK" : "UNAVAILABLE",
      message: this.isAvailable
        ? "Mock DigiLocker Adapter active (synthetic document verification mode)"
        : "Mock DigiLocker Adapter is set to simulated unavailable state",
      lastChecked: new Date().toISOString(),
      latencyMs: 12,
      capabilities: [
        "caste_certificate_verification",
        "income_certificate_verification",
        "academic_transcript_verification",
        "aadhaar_xml_verification",
      ],
    };
  }

  async verifyDocument(request: DigiLockerVerifyRequest): Promise<DigiLockerVerifyResponse> {
    if (!this.isAvailable) {
      throw new IntegrationUnavailableError(
        this.providerId,
        "DigiLocker Gateway is temporarily unreachable"
      );
    }

    if (!request.docNumber || request.docNumber.trim() === "") {
      throw new IntegrationValidationError(this.providerId, "Document number cannot be empty");
    }

    // Simulation triggers for testing error conditions
    if (request.docNumber.includes("SIMULATE_TIMEOUT")) {
      throw new IntegrationTimeoutError(this.providerId, 5000);
    }
    if (request.docNumber.includes("SIMULATE_UNAVAILABLE")) {
      throw new IntegrationUnavailableError(this.providerId, "Simulated upstream 503 error");
    }
    if (request.docNumber.includes("SIMULATE_AUTH_ERROR")) {
      throw new IntegrationAuthError(this.providerId, "Simulated invalid OAuth2 client token");
    }
    if (request.docNumber.includes("SIMULATE_MALFORMED")) {
      throw new IntegrationMalformedResponseError(
        this.providerId,
        "Simulated missing root verification payload"
      );
    }

    const holder = request.candidateName || "Ramesh Meena";
    const state = request.stateDomicile || "Rajasthan";
    const verificationId = `DL-VRF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    let issuer = "Government of " + state;
    if (request.docType === "CASTE_CERTIFICATE") {
      issuer = `Revenue Department, District Magistrate, Udaipur, ${state}`;
    } else if (request.docType === "INCOME_CERTIFICATE") {
      issuer = `Tehsildar Office, Girwa, Udaipur, ${state}`;
    } else if (request.docType === "DEGREE_TRANSCRIPT") {
      issuer = "Mohanlal Sukhadia University, Udaipur";
    }

    return {
      isVerified: true,
      verificationId,
      documentUri: `digilocker://in.gov.${state.toLowerCase()}.${request.docType.toLowerCase()}/${request.docNumber}`,
      issuerName: issuer,
      issuedDate: request.yearOfIssue ? `${request.yearOfIssue}-05-20` : "2023-05-20",
      certificateHolder: holder,
      documentType: request.docType,
      metadata: {
        categoryVerified: "ST (Scheduled Tribe)",
        community: "Mina / Meena",
        certificateNumber: request.docNumber,
        state,
        digitalSignatureValid: true,
      },
      source: "DIGILOCKER_MOCK_ADAPTER",
    };
  }

  async fetchDocumentMetadata(uri: string): Promise<DigiLockerDocMetadata> {
    if (!uri.startsWith("digilocker://")) {
      throw new IntegrationValidationError(
        this.providerId,
        `Invalid DigiLocker URI scheme: "${uri}"`
      );
    }

    return {
      uri,
      docType: "CASTE_CERTIFICATE",
      issuerId: "in.gov.rajasthan.revenue",
      issuerName: "Revenue Department, Government of Rajasthan",
      validUpto: "PERMANENT",
      isRevoked: false,
    };
  }
}
