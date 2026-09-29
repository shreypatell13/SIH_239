import { IntegrationHealth } from "../core/types";

export interface PfmsAccountValidationRequest {
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
}

export interface PfmsAccountValidationResponse {
  isValid: boolean;
  beneficiaryCode: string;
  bankName: string;
  branchName: string;
  maskedAccountNumber: string;
  validationStatus: "VALIDATED" | "REJECTED" | "INVALID_IFSC" | "NAME_MISMATCH";
  remarks?: string;
  source: "PFMS_MOCK_ADAPTER" | "PFMS_PRODUCTION";
}

export interface PfmsDisbursementRequest {
  sanctionOrderNumber: string;
  scholarId: string;
  schemeCode: string;
  amountInr: number;
  installmentNumber: number;
  beneficiaryAccountMasked: string;
  ifscCode: string;
  academicYear?: string;
}

export interface PfmsDisbursementResponse {
  transactionId: string;
  pfmsReferenceNumber: string;
  sanctionOrderNumber: string;
  amountInr: number;
  status: "INITIATED" | "PROCESSING" | "CREDITED" | "FAILED" | "REJECTED";
  utrNumber: string;
  timestamp: string;
  source: "PFMS_MOCK_ADAPTER" | "PFMS_PRODUCTION";
}

export interface PfmsStatusCheckRequest {
  pfmsReferenceNumber: string;
  transactionId?: string;
}

export interface IPfmsAdapter {
  validateAccount(request: PfmsAccountValidationRequest): Promise<PfmsAccountValidationResponse>;
  initiateDisbursement(request: PfmsDisbursementRequest): Promise<PfmsDisbursementResponse>;
  checkDisbursementStatus(request: PfmsStatusCheckRequest): Promise<PfmsDisbursementResponse>;
  checkHealth(): Promise<IntegrationHealth>;
}
