import { describe, it, expect, beforeEach } from "vitest";
import {
  MockDigiLockerAdapter,
  MockPfmsAdapter,
  MockNspAdapter,
  MockMotaAdapter,
  IntegrationRegistry,
  IntegrationTimeoutError,
  IntegrationUnavailableError,
  IntegrationValidationError,
  IntegrationAuthError,
  IntegrationMalformedResponseError,
} from "@/server/integrations";
import { IntegrationService } from "@/server/services/integration.service";

describe("Phase 2L — Integration Adapters & Boundaries", () => {
  let digiLocker: MockDigiLockerAdapter;
  let pfms: MockPfmsAdapter;
  let nsp: MockNspAdapter;
  let mota: MockMotaAdapter;
  let registry: IntegrationRegistry;
  let service: IntegrationService;

  beforeEach(() => {
    digiLocker = new MockDigiLockerAdapter();
    pfms = new MockPfmsAdapter();
    nsp = new MockNspAdapter();
    mota = new MockMotaAdapter();

    registry = new IntegrationRegistry();
    registry.setDigiLockerAdapter(digiLocker);
    registry.setPfmsAdapter(pfms);
    registry.setNspAdapter(nsp);
    registry.setMotaAdapter(mota);

    service = new IntegrationService(registry);
  });

  describe("1. DigiLocker Adapter", () => {
    it("verifies valid caste certificate deterministically in mock mode", async () => {
      const res = await digiLocker.verifyDocument({
        docType: "CASTE_CERTIFICATE",
        docNumber: "ST-RAJ-2023-889912",
        candidateName: "Ramesh Meena",
        stateDomicile: "Rajasthan",
        yearOfIssue: 2023,
      });

      expect(res.isVerified).toBe(true);
      expect(res.source).toBe("DIGILOCKER_MOCK_ADAPTER");
      expect(res.certificateHolder).toBe("Ramesh Meena");
      expect(res.documentUri).toContain(
        "digilocker://in.gov.rajasthan.caste_certificate/ST-RAJ-2023-889912"
      );
      expect(res.metadata.categoryVerified).toBe("ST (Scheduled Tribe)");
    });

    it("returns a stable verification ID for the same demo document", async () => {
      const request = {
        docType: "CASTE_CERTIFICATE" as const,
        docNumber: "ST-RAJ-DEMO-001",
        candidateName: "Synthetic Applicant",
        stateDomicile: "Rajasthan",
      };
      const first = await digiLocker.verifyDocument(request);
      const second = await digiLocker.verifyDocument(request);
      expect(second.verificationId).toBe(first.verificationId);
    });

    it("throws IntegrationValidationError when document number is empty", async () => {
      await expect(
        digiLocker.verifyDocument({
          docType: "CASTE_CERTIFICATE",
          docNumber: "",
        })
      ).rejects.toThrow(IntegrationValidationError);
    });

    it("handles simulated timeout triggers", async () => {
      await expect(
        digiLocker.verifyDocument({
          docType: "CASTE_CERTIFICATE",
          docNumber: "SIMULATE_TIMEOUT_DOC",
        })
      ).rejects.toThrow(IntegrationTimeoutError);
    });

    it("handles simulated provider unavailable triggers", async () => {
      await expect(
        digiLocker.verifyDocument({
          docType: "CASTE_CERTIFICATE",
          docNumber: "SIMULATE_UNAVAILABLE_DOC",
        })
      ).rejects.toThrow(IntegrationUnavailableError);
    });

    it("handles simulated auth failure triggers", async () => {
      await expect(
        digiLocker.verifyDocument({
          docType: "CASTE_CERTIFICATE",
          docNumber: "SIMULATE_AUTH_ERROR_DOC",
        })
      ).rejects.toThrow(IntegrationAuthError);
    });

    it("handles simulated malformed response triggers", async () => {
      await expect(
        digiLocker.verifyDocument({
          docType: "CASTE_CERTIFICATE",
          docNumber: "SIMULATE_MALFORMED_DOC",
        })
      ).rejects.toThrow(IntegrationMalformedResponseError);
    });

    it("handles provider toggle to unavailable state", async () => {
      digiLocker.setAvailability(false);
      await expect(
        digiLocker.verifyDocument({
          docType: "CASTE_CERTIFICATE",
          docNumber: "ST-12345",
        })
      ).rejects.toThrow(IntegrationUnavailableError);
    });
  });

  describe("2. PFMS Adapter", () => {
    it("validates valid bank account with valid RBI IFSC code format", async () => {
      const res = await pfms.validateAccount({
        accountNumber: "987654321012",
        ifscCode: "SBIN0001234",
        accountHolderName: "Ramesh Meena",
      });

      expect(res.isValid).toBe(true);
      expect(res.validationStatus).toBe("VALIDATED");
      expect(res.bankName).toBe("State Bank of India");
      expect(res.maskedAccountNumber).toBe("XXXX-XXXX-1012");
      expect(res.source).toBe("PFMS_MOCK_ADAPTER");
    });

    it("rejects invalid IFSC code pattern without throwing unhandled exceptions", async () => {
      const res = await pfms.validateAccount({
        accountNumber: "987654321012",
        ifscCode: "INVALID_IFSC_123",
        accountHolderName: "Ramesh Meena",
      });

      expect(res.isValid).toBe(false);
      expect(res.validationStatus).toBe("INVALID_IFSC");
      expect(res.maskedAccountNumber).toBe("XXXX-XXXX-1012");
    });

    it("initiates DBT grant disbursement with synthetic PFMS reference", async () => {
      const request = {
        sanctionOrderNumber: "SANCTION-NOS-2025-001",
        scholarId: "SCHOLAR-RM-01",
        schemeCode: "NOS",
        amountInr: 1200000,
        installmentNumber: 1,
        beneficiaryAccountMasked: "XXXX-XXXX-1012",
        ifscCode: "SBIN0001234",
      };
      const res = await pfms.initiateDisbursement(request);
      const repeated = await pfms.initiateDisbursement(request);

      expect(res.amountInr).toBe(1200000);
      expect(res.status).toBe("CREDITED");
      expect(res.pfmsReferenceNumber).toMatch(/^PFMS-\d{4}-NOS-\d{6}$/);
      expect(res.utrNumber).toMatch(/^UTR\d+/);
      expect(res.source).toBe("PFMS_MOCK_ADAPTER");
      expect(repeated.pfmsReferenceNumber).toBe(res.pfmsReferenceNumber);
      expect(repeated.transactionId).toBe(res.transactionId);
      expect(repeated.utrNumber).toBe(res.utrNumber);
    });

    it("rejects zero or negative disbursement amounts", async () => {
      await expect(
        pfms.initiateDisbursement({
          sanctionOrderNumber: "SO-INVALID",
          scholarId: "S-1",
          schemeCode: "NFST",
          amountInr: -5000,
          installmentNumber: 1,
          beneficiaryAccountMasked: "XXXX-1234",
          ifscCode: "SBIN0001234",
        })
      ).rejects.toThrow(IntegrationValidationError);
    });

    it("handles simulated PFMS rejection trigger", async () => {
      const res = await pfms.initiateDisbursement({
        sanctionOrderNumber: "SANCTION-SIMULATE_REJECT-001",
        scholarId: "S-1",
        schemeCode: "NOS",
        amountInr: 500000,
        installmentNumber: 1,
        beneficiaryAccountMasked: "XXXX-1234",
        ifscCode: "SBIN0001234",
      });

      expect(res.status).toBe("FAILED");
      expect(res.utrNumber).toBe("");
    });
  });

  describe("3. NSP Deduplication Adapter", () => {
    it("returns cleared status for regular applicants", async () => {
      const res = await nsp.checkDeduplication({
        candidateName: "Ramesh Meena",
        academicYear: "2024-25",
        schemeCode: "NOS",
      });

      expect(res.hasDuplicateAward).toBe(false);
      expect(res.deDupStatus).toBe("CLEARED");
      expect(res.source).toBe("NSP_MOCK_ADAPTER");
    });

    it("flags duplicate awards for simulated collision scenarios", async () => {
      const res = await nsp.checkDeduplication({
        candidateName: "SIMULATE_DUPLICATE_CANDIDATE",
        academicYear: "2024-25",
        schemeCode: "NFST",
      });

      expect(res.hasDuplicateAward).toBe(true);
      expect(res.deDupStatus).toBe("FLAGGED");
      expect(res.duplicateRecords?.length).toBeGreaterThan(0);
      expect(res.duplicateRecords?.[0].schemeName).toContain("Post-Matric Scholarship");
    });
  });

  describe("4. MoTA Quota & Gateway Adapter", () => {
    it("acknowledges national quota sync requests", async () => {
      const request = {
        schemeCode: "NOS",
        fiscalYear: "2024-2025",
        totalSlots: 100,
        utilizedSlots: 42,
      };
      const res = await mota.syncQuota(request);
      const repeated = await mota.syncQuota(request);

      expect(res.acknowledged).toBe(true);
      expect(res.schemeCode).toBe("NOS");
      expect(res.motaReferenceNumber).toContain("MOTA/SCHEME/NOS/2024-2025");
      expect(res.source).toBe("MOTA_MOCK_ADAPTER");
      expect(repeated.syncId).toBe(res.syncId);
    });
  });

  describe("5. Integration Health Aggregator & Registry", () => {
    it("reports overall HEALTHY when all adapters are in mock mode", async () => {
      const summary = await registry.getSystemHealth();

      expect(summary.overallStatus).toBe("HEALTHY");
      expect(summary.mode).toBe("MOCK");
      expect(summary.providers).toHaveLength(4);
      expect(summary.providers.every((p) => p.status === "MOCK")).toBe(true);
    });

    it("reports DEGRADED when an adapter is unavailable", async () => {
      pfms.setAvailability(false);

      const summary = await registry.getSystemHealth();
      expect(summary.overallStatus).toBe("DEGRADED");
      const pfmsHealth = summary.providers.find((p) => p.providerId === "pfms");
      expect(pfmsHealth?.status).toBe("UNAVAILABLE");
    });
  });
});
