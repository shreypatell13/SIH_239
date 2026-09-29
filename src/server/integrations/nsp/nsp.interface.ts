import { IntegrationHealth } from "../core/types";

export interface NspDeduplicationRequest {
  applicantAadhaarVaultRef?: string;
  aadhaarLast4?: string;
  candidateName: string;
  academicYear: string;
  schemeCode: string;
}

export interface DuplicateScholarshipRecord {
  schemeName: string;
  academicYear: string;
  awardingBody: string;
  sanctionDate: string;
  amountInr: number;
}

export interface NspDeduplicationResponse {
  hasDuplicateAward: boolean;
  deDupStatus: "CLEARED" | "FLAGGED";
  duplicateRecords?: DuplicateScholarshipRecord[];
  checkedAt: string;
  source: "NSP_MOCK_ADAPTER" | "NSP_PRODUCTION";
}

export interface NspScholarRegistrationRequest {
  scholarName: string;
  schemeCode: string;
  academicYear: string;
  sanctionOrderNumber: string;
  tenureYears: number;
}

export interface NspScholarRegistrationResponse {
  nspApplicationId: string;
  status: "REGISTERED" | "ALREADY_REGISTERED";
  registrationDate: string;
  source: "NSP_MOCK_ADAPTER" | "NSP_PRODUCTION";
}

export interface INspAdapter {
  checkDeduplication(request: NspDeduplicationRequest): Promise<NspDeduplicationResponse>;
  registerScholar(request: NspScholarRegistrationRequest): Promise<NspScholarRegistrationResponse>;
  checkHealth(): Promise<IntegrationHealth>;
}
