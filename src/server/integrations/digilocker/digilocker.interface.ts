import { IntegrationHealth } from "../core/types";

export type DigiLockerDocType =
  "CASTE_CERTIFICATE" | "INCOME_CERTIFICATE" | "DEGREE_TRANSCRIPT" | "AADHAAR" | "PASSPORT";

export interface DigiLockerVerifyRequest {
  docType: DigiLockerDocType;
  docNumber: string;
  candidateName?: string;
  stateDomicile?: string;
  yearOfIssue?: number;
}

export interface DigiLockerVerifyResponse {
  isVerified: boolean;
  verificationId: string;
  documentUri: string;
  issuerName: string;
  issuedDate: string;
  certificateHolder: string;
  documentType: DigiLockerDocType;
  metadata: Record<string, unknown>;
  source: "DIGILOCKER_MOCK_ADAPTER" | "DIGILOCKER_PRODUCTION";
}

export interface DigiLockerDocMetadata {
  uri: string;
  docType: DigiLockerDocType;
  issuerId: string;
  issuerName: string;
  validUpto?: string;
  isRevoked: boolean;
}

export interface IDigiLockerAdapter {
  verifyDocument(request: DigiLockerVerifyRequest): Promise<DigiLockerVerifyResponse>;
  fetchDocumentMetadata(uri: string): Promise<DigiLockerDocMetadata>;
  checkHealth(): Promise<IntegrationHealth>;
}
