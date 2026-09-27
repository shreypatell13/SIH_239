export interface DigiLockerVerificationResult {
  isVerified: boolean;
  documentUri?: string;
  issuerName?: string;
  issuedDate?: string;
  source: "DIGILOCKER_MOCK_ADAPTER";
}

export interface PfmsDisbursementRecord {
  sanctionOrderNumber: string;
  beneficiaryAccountMasked: string;
  amountInr: number;
  status: "CREDITED" | "PROCESSING" | "RETURNED";
  utrNumber: string;
  source: "PFMS_MOCK_ADAPTER";
}

export interface IIntegrationService {
  verifyViaDigiLocker(docType: string, docNumber: string): Promise<DigiLockerVerificationResult>;
  triggerPfmsDisbursement(sanctionId: string, amount: number): Promise<PfmsDisbursementRecord>;
}

export class IntegrationService implements IIntegrationService {
  async verifyViaDigiLocker(
    _docType: string,
    _docNumber: string
  ): Promise<DigiLockerVerificationResult> {
    return {
      isVerified: true,
      documentUri: "digilocker://in.gov.tribal/caste/sample_st_cert",
      issuerName: "Sub-Divisional Magistrate (SDM), Udaipur",
      issuedDate: "2024-03-15",
      source: "DIGILOCKER_MOCK_ADAPTER",
    };
  }

  async triggerPfmsDisbursement(
    sanctionId: string,
    amount: number
  ): Promise<PfmsDisbursementRecord> {
    return {
      sanctionOrderNumber: `SO_${sanctionId}`,
      beneficiaryAccountMasked: "XXXX-XXXX-4921",
      amountInr: amount,
      status: "CREDITED",
      utrNumber: `UTR_${Date.now()}`,
      source: "PFMS_MOCK_ADAPTER",
    };
  }
}

export const integrationService = new IntegrationService();
