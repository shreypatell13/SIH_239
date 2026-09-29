import {
  IPfmsAdapter,
  PfmsAccountValidationRequest,
  PfmsAccountValidationResponse,
  PfmsDisbursementRequest,
  PfmsDisbursementResponse,
  PfmsStatusCheckRequest,
} from "./pfms.interface";
import { IntegrationHealth } from "../core/types";
import {
  IntegrationTimeoutError,
  IntegrationUnavailableError,
  IntegrationValidationError,
  IntegrationAuthError,
} from "../core/errors";

export class MockPfmsAdapter implements IPfmsAdapter {
  private readonly providerId = "pfms";
  private isAvailable = true;

  public setAvailability(available: boolean): void {
    this.isAvailable = available;
  }

  async checkHealth(): Promise<IntegrationHealth> {
    return {
      providerId: this.providerId,
      providerName: "Public Financial Management System (PFMS / DBT Gateway)",
      mode: "MOCK",
      status: this.isAvailable ? "MOCK" : "UNAVAILABLE",
      message: this.isAvailable
        ? "Mock PFMS Adapter active (synthetic DBT grant disbursement simulation)"
        : "Mock PFMS Adapter is set to simulated unavailable state",
      lastChecked: new Date().toISOString(),
      latencyMs: 18,
      capabilities: [
        "dbt_beneficiary_validation",
        "dbt_disbursement_sanction",
        "pfms_transaction_tracking",
        "npc_aadhaar_bridge_lookup",
      ],
    };
  }

  private maskAccount(account: string): string {
    const clean = account.replace(/\s+/g, "");
    if (clean.length < 4) return "XXXX-XXXX-XXXX";
    const last4 = clean.slice(-4);
    return `XXXX-XXXX-${last4}`;
  }

  async validateAccount(
    request: PfmsAccountValidationRequest
  ): Promise<PfmsAccountValidationResponse> {
    if (!this.isAvailable) {
      throw new IntegrationUnavailableError(
        this.providerId,
        "PFMS Banking validation service is temporarily unavailable"
      );
    }

    if (!request.accountNumber || !request.ifscCode) {
      throw new IntegrationValidationError(
        this.providerId,
        "Account number and IFSC code are required for validation"
      );
    }

    const cleanIfsc = request.ifscCode.trim().toUpperCase();
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

    if (!ifscRegex.test(cleanIfsc)) {
      return {
        isValid: false,
        beneficiaryCode: "",
        bankName: "UNKNOWN",
        branchName: "UNKNOWN",
        maskedAccountNumber: this.maskAccount(request.accountNumber),
        validationStatus: "INVALID_IFSC",
        remarks: `Invalid IFSC format: "${request.ifscCode}". Must match standard 11-character RBI format.`,
        source: "PFMS_MOCK_ADAPTER",
      };
    }

    let bankName = "State Bank of India";
    if (cleanIfsc.startsWith("PUNB")) bankName = "Punjab National Bank";
    else if (cleanIfsc.startsWith("BARB")) bankName = "Bank of Baroda";
    else if (cleanIfsc.startsWith("HDFC")) bankName = "HDFC Bank";
    else if (cleanIfsc.startsWith("ICIC")) bankName = "ICICI Bank";

    const beneficiaryCode = `BEN-${cleanIfsc.substring(0, 4)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return {
      isValid: true,
      beneficiaryCode,
      bankName,
      branchName: "Main Branch, District Center",
      maskedAccountNumber: this.maskAccount(request.accountNumber),
      validationStatus: "VALIDATED",
      remarks: "Account successfully pre-validated against simulated NPCI mapper",
      source: "PFMS_MOCK_ADAPTER",
    };
  }

  async initiateDisbursement(request: PfmsDisbursementRequest): Promise<PfmsDisbursementResponse> {
    if (!this.isAvailable) {
      throw new IntegrationUnavailableError(
        this.providerId,
        "PFMS DBT Payment Gateway is currently unreachable"
      );
    }

    if (request.amountInr <= 0) {
      throw new IntegrationValidationError(
        this.providerId,
        "Disbursement amount must be greater than zero",
        { amountInr: request.amountInr }
      );
    }

    if (request.sanctionOrderNumber.includes("SIMULATE_TIMEOUT")) {
      throw new IntegrationTimeoutError(this.providerId, 8000);
    }
    if (request.sanctionOrderNumber.includes("SIMULATE_UNAVAILABLE")) {
      throw new IntegrationUnavailableError(this.providerId, "Simulated upstream payment failure");
    }
    if (request.sanctionOrderNumber.includes("SIMULATE_AUTH_ERROR")) {
      throw new IntegrationAuthError(this.providerId, "Simulated agency digital signature expired");
    }

    const year = new Date().getFullYear();
    const scheme = request.schemeCode.toUpperCase();
    const hex = Math.floor(100000 + Math.random() * 900000).toString();
    const pfmsRef = `PFMS-${year}-${scheme}-${hex}`;
    const utr = `UTR${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;

    const isSimulatedReject = request.sanctionOrderNumber.includes("SIMULATE_REJECT");

    return {
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      pfmsReferenceNumber: pfmsRef,
      sanctionOrderNumber: request.sanctionOrderNumber,
      amountInr: request.amountInr,
      status: isSimulatedReject ? "FAILED" : "CREDITED",
      utrNumber: isSimulatedReject ? "" : utr,
      timestamp: new Date().toISOString(),
      source: "PFMS_MOCK_ADAPTER",
    };
  }

  async checkDisbursementStatus(
    request: PfmsStatusCheckRequest
  ): Promise<PfmsDisbursementResponse> {
    if (!this.isAvailable) {
      throw new IntegrationUnavailableError(
        this.providerId,
        "PFMS Transaction Status Service is unavailable"
      );
    }

    return {
      transactionId: request.transactionId || `TXN-QUERY-${Date.now()}`,
      pfmsReferenceNumber: request.pfmsReferenceNumber,
      sanctionOrderNumber: "SO-SANCTION-VERIFIED",
      amountInr: 1200000,
      status: "CREDITED",
      utrNumber: `UTR${Date.now().toString().slice(-8)}9921`,
      timestamp: new Date().toISOString(),
      source: "PFMS_MOCK_ADAPTER",
    };
  }
}
