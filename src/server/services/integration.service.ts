/**
 * Integration Service
 * Phase 2L: Integration Adapters & Security Hardening
 *
 * Coordinates domain interactions with external government system adapters
 * (DigiLocker, PFMS, NSP, MoTA) and guarantees audit-safe logging.
 */

import {
  integrationRegistry,
  IntegrationRegistry,
  DigiLockerVerifyRequest,
  DigiLockerVerifyResponse,
  PfmsAccountValidationRequest,
  PfmsAccountValidationResponse,
  PfmsDisbursementRequest,
  PfmsDisbursementResponse,
  NspDeduplicationRequest,
  NspDeduplicationResponse,
  MotaQuotaSyncRequest,
  MotaQuotaSyncResponse,
  SystemIntegrationsHealthSummary,
} from "../integrations";
import { auditRepository } from "../repositories/audit.repository";
import { sanitizeAuditPayload } from "../utils/security-sanitizer";
import { Prisma } from "@prisma/client";

export interface DigiLockerVerificationResult {
  isVerified: boolean;
  documentUri?: string;
  issuerName?: string;
  issuedDate?: string;
  source: "DIGILOCKER_MOCK_ADAPTER" | "DIGILOCKER_PRODUCTION";
}

export interface PfmsDisbursementRecord {
  sanctionOrderNumber: string;
  beneficiaryAccountMasked: string;
  amountInr: number;
  status: "CREDITED" | "PROCESSING" | "RETURNED" | "INITIATED" | "FAILED";
  utrNumber: string;
  source: "PFMS_MOCK_ADAPTER" | "PFMS_PRODUCTION";
}

export interface IIntegrationService {
  verifyViaDigiLocker(
    docType: string,
    docNumber: string,
    context?: { caseDossierId?: string; actorId?: string }
  ): Promise<DigiLockerVerificationResult>;
  triggerPfmsDisbursement(
    sanctionId: string,
    amount: number,
    context?: {
      caseDossierId?: string;
      actorId?: string;
      schemeCode?: string;
      accountNumber?: string;
      ifscCode?: string;
    }
  ): Promise<PfmsDisbursementRecord>;
  validateBankAccount(
    request: PfmsAccountValidationRequest,
    context?: { actorId?: string }
  ): Promise<PfmsAccountValidationResponse>;
  checkNspDeduplication(
    request: NspDeduplicationRequest,
    context?: { caseDossierId?: string; actorId?: string }
  ): Promise<NspDeduplicationResponse>;
  syncMotaQuota(
    request: MotaQuotaSyncRequest,
    context?: { actorId?: string }
  ): Promise<MotaQuotaSyncResponse>;
  getSystemHealth(): Promise<SystemIntegrationsHealthSummary>;
}

export class IntegrationService implements IIntegrationService {
  constructor(private registry: IntegrationRegistry = integrationRegistry) {}

  async verifyViaDigiLocker(
    docType: string,
    docNumber: string,
    context?: { caseDossierId?: string; actorId?: string }
  ): Promise<DigiLockerVerificationResult> {
    const adapter = this.registry.getDigiLocker();
    const response: DigiLockerVerifyResponse = await adapter.verifyDocument({
      docType: docType as any,
      docNumber,
    });

    if (context?.caseDossierId && context?.actorId) {
      await auditRepository
        .create({
          caseDossierId: context.caseDossierId,
          actorId: context.actorId,
          actorRole: "VERIFICATION_OFFICER",
          actionType: "DIGILOCKER_VERIFICATION_PERFORMED",
          payload: sanitizeAuditPayload({
            docType,
            docNumber,
            isVerified: response.isVerified,
            verificationId: response.verificationId,
            issuer: response.issuerName,
            source: response.source,
          }) as Prisma.InputJsonValue,
        })
        .catch(() => {});
    }

    return {
      isVerified: response.isVerified,
      documentUri: response.documentUri,
      issuerName: response.issuerName,
      issuedDate: response.issuedDate,
      source: response.source,
    };
  }

  async triggerPfmsDisbursement(
    sanctionId: string,
    amount: number,
    context?: {
      caseDossierId?: string;
      actorId?: string;
      schemeCode?: string;
      accountNumber?: string;
      ifscCode?: string;
    }
  ): Promise<PfmsDisbursementRecord> {
    const adapter = this.registry.getPfms();
    const response: PfmsDisbursementResponse = await adapter.initiateDisbursement({
      sanctionOrderNumber: `SO_${sanctionId}`,
      scholarId: context?.actorId || "SCHOLAR-DEFAULT",
      schemeCode: context?.schemeCode || "NOS",
      amountInr: amount,
      installmentNumber: 1,
      beneficiaryAccountMasked: context?.accountNumber
        ? `XXXX-XXXX-${context.accountNumber.slice(-4)}`
        : "XXXX-XXXX-4921",
      ifscCode: context?.ifscCode || "SBIN0001234",
    });

    if (context?.caseDossierId && context?.actorId) {
      await auditRepository
        .create({
          caseDossierId: context.caseDossierId,
          actorId: context.actorId,
          actorRole: "VERIFICATION_OFFICER",
          actionType: "PFMS_DISBURSEMENT_INITIATED",
          payload: sanitizeAuditPayload({
            sanctionOrderNumber: response.sanctionOrderNumber,
            pfmsReferenceNumber: response.pfmsReferenceNumber,
            amountInr: response.amountInr,
            status: response.status,
            utrNumber: response.utrNumber,
            source: response.source,
          }) as Prisma.InputJsonValue,
        })
        .catch(() => {});
    }

    return {
      sanctionOrderNumber: response.sanctionOrderNumber,
      beneficiaryAccountMasked: context?.accountNumber
        ? `XXXX-XXXX-${context.accountNumber.slice(-4)}`
        : "XXXX-XXXX-4921",
      amountInr: response.amountInr,
      status: response.status as PfmsDisbursementRecord["status"],
      utrNumber: response.utrNumber,
      source: response.source,
    };
  }

  async validateBankAccount(
    request: PfmsAccountValidationRequest,
    context?: { actorId?: string }
  ): Promise<PfmsAccountValidationResponse> {
    const adapter = this.registry.getPfms();
    return adapter.validateAccount(request);
  }

  async checkNspDeduplication(
    request: NspDeduplicationRequest,
    context?: { caseDossierId?: string; actorId?: string }
  ): Promise<NspDeduplicationResponse> {
    const adapter = this.registry.getNsp();
    const result = await adapter.checkDeduplication(request);

    if (context?.caseDossierId && context?.actorId) {
      await auditRepository
        .create({
          caseDossierId: context.caseDossierId,
          actorId: context.actorId,
          actorRole: "VERIFICATION_OFFICER",
          actionType: "NSP_DEDUPLICATION_CHECKED",
          payload: sanitizeAuditPayload({
            candidateName: request.candidateName,
            schemeCode: request.schemeCode,
            hasDuplicateAward: result.hasDuplicateAward,
            deDupStatus: result.deDupStatus,
            source: result.source,
          }) as Prisma.InputJsonValue,
        })
        .catch(() => {});
    }

    return result;
  }

  async syncMotaQuota(
    request: MotaQuotaSyncRequest,
    context?: { actorId?: string }
  ): Promise<MotaQuotaSyncResponse> {
    const adapter = this.registry.getMota();
    return adapter.syncQuota(request);
  }

  async getSystemHealth(): Promise<SystemIntegrationsHealthSummary> {
    return this.registry.getSystemHealth();
  }
}

export const integrationService = new IntegrationService();
