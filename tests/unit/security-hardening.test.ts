import { describe, it, expect } from "vitest";
import { LocalStorageAdapter } from "@/server/storage/local-storage.adapter";
import {
  maskAadhaar,
  maskBankAccount,
  sanitizeAuditPayload,
  sanitizeErrorMessage,
} from "@/server/utils/security-sanitizer";
import { MagicByteValidator } from "@/server/documents/security/magic-byte.validator";

describe("Phase 2L — Security Hardening & Protection Boundaries", () => {
  describe("1. Storage Adapter Path Traversal Protection", () => {
    const storage = new LocalStorageAdapter("./uploads/documents");

    it("sanitizes valid hierarchical keys into safe path containment", () => {
      const { safeKey, targetPath } = storage.resolveSafePath("case123/CASTE_CERT/doc.pdf");
      expect(safeKey).toBe("case123_CASTE_CERT_doc.pdf");
      expect(targetPath).toContain("case123_CASTE_CERT_doc.pdf");
    });

    it("strips null bytes from storage keys", () => {
      const { safeKey } = storage.resolveSafePath("case123\0/doc.pdf");
      expect(safeKey).not.toContain("\0");
      expect(safeKey).toBe("case123_doc.pdf");
    });

    it("throws a security error on empty or non-string key", () => {
      expect(() => storage.resolveSafePath("")).toThrow(/SECURITY_ERROR/);
    });
  });

  describe("2. PII & Audit Payload Sanitization", () => {
    it("masks Aadhaar number to last 4 digits only", () => {
      expect(maskAadhaar("1234-5678-9012")).toBe("XXXX-XXXX-9012");
      expect(maskAadhaar("9012")).toBe("XXXX-XXXX-9012");
      expect(maskAadhaar(null)).toBe("XXXX-XXXX-XXXX");
      expect(maskAadhaar("")).toBe("XXXX-XXXX-XXXX");
    });

    it("masks bank account numbers to last 4 digits only", () => {
      expect(maskBankAccount("987654321012")).toBe("XXXX-XXXX-1012");
      expect(maskBankAccount("1012")).toBe("XXXX-XXXX-1012");
      expect(maskBankAccount(null)).toBe("XXXX-XXXX-XXXX");
    });

    it("recursively sanitizes sensitive tokens, passwords, and PII in audit payloads", () => {
      const rawPayload = {
        action: "USER_LOGIN",
        password: "SuperSecretPassword123!",
        passwordHash: "$2a$12$eX4mPL3H4sh",
        token: "jwt.session.token.secret",
        apiKey: "AIzaSySecretApiKey",
        aadhaar: "1234-5678-4321",
        accountNumber: "987654321012",
        nested: {
          authorization: "Bearer secret-token",
          applicantAadhaar: "9988-7766-5544",
          safeField: "Public Scheme Info",
        },
        items: [{ secret: "hidden1", value: "ok" }, { bankAccount: "112233445566" }],
      };

      const sanitized = sanitizeAuditPayload(rawPayload);

      expect(sanitized.password).toBe("[REDACTED]");
      expect(sanitized.passwordHash).toBe("[REDACTED]");
      expect(sanitized.token).toBe("[REDACTED]");
      expect(sanitized.apiKey).toBe("[REDACTED]");
      expect(sanitized.aadhaar).toBe("XXXX-XXXX-4321");
      expect(sanitized.accountNumber).toBe("XXXX-XXXX-1012");

      const nested = sanitized.nested as Record<string, unknown>;
      expect(nested.authorization).toBe("[REDACTED]");
      expect(nested.applicantAadhaar).toBe("XXXX-XXXX-5544");
      expect(nested.safeField).toBe("Public Scheme Info");

      const items = sanitized.items as Array<Record<string, unknown>>;
      expect(items[0].secret).toBe("[REDACTED]");
      expect(items[0].value).toBe("ok");
      expect(items[1].bankAccount).toBe("XXXX-XXXX-5566");
    });

    it("sanitizes error messages by scrubbing postgres database credentials and absolute paths", () => {
      const rawError = new Error(
        "Connection failed to postgresql://postgres:mypassword123@localhost:5432/tribalscholar_db at C:\\Users\\secret_user\\project\\src\\db.ts:42"
      );

      const sanitized = sanitizeErrorMessage(rawError);

      expect(sanitized).not.toContain("mypassword123");
      expect(sanitized).toContain("postgresql://[REDACTED_CREDENTIALS]");
      expect(sanitized).not.toContain("C:\\Users\\secret_user");
      expect(sanitized).toContain("[REDACTED_PATH]");
    });
  });

  describe("3. Document Magic-Byte Validation", () => {
    it("validates genuine PDF magic byte headers (%PDF-)", () => {
      const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
      const res = MagicByteValidator.validate(pdfBuffer, "application/pdf");
      expect(res.isValid).toBe(true);
      expect(res.detectedMimeType).toBe("application/pdf");
    });

    it("validates genuine JPEG magic byte headers", () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      const res = MagicByteValidator.validate(jpegBuffer, "image/jpeg");
      expect(res.isValid).toBe(true);
      expect(res.detectedMimeType).toBe("image/jpeg");
    });

    it("validates genuine PNG magic byte headers", () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const res = MagicByteValidator.validate(pngBuffer, "image/png");
      expect(res.isValid).toBe(true);
      expect(res.detectedMimeType).toBe("image/png");
    });

    it("rejects file disguised with incorrect MIME type (e.g. executable disguised as PDF)", () => {
      const exeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00]); // MZ header
      const res = MagicByteValidator.validate(exeBuffer, "application/pdf");
      expect(res.isValid).toBe(false);
      expect(res.error).toBe("UNKNOWN_MAGIC_BYTES");
    });

    it("rejects MIME signature mismatches (e.g. JPEG declared as PDF)", () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      const res = MagicByteValidator.validate(jpegBuffer, "application/pdf");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("MIME_SIGNATURE_MISMATCH");
    });
  });
});
