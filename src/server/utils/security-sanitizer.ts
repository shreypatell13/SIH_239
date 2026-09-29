/**
 * Security & PII Sanitizer Utility
 * Phase 2L: Integration Adapters & Security Hardening
 *
 * Provides functions to redact sensitive PII, passwords, authentication tokens,
 * and database connection details before writing to audit logs or API responses.
 */

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "token",
  "secret",
  "nextauth_secret",
  "jwt",
  "authorization",
  "apikey",
  "api_key",
  "privatekey",
  "private_key",
  "cookie",
  "database_url",
]);

/**
 * Masks Aadhaar number to display only the last 4 digits (e.g., "XXXX-XXXX-1234").
 */
export function maskAadhaar(aadhaar: string | null | undefined): string {
  if (!aadhaar) return "XXXX-XXXX-XXXX";
  const clean = aadhaar.replace(/[^0-9]/g, "");
  if (clean.length < 4) return "XXXX-XXXX-XXXX";
  return `XXXX-XXXX-${clean.slice(-4)}`;
}

/**
 * Masks bank account number to display only the last 4 digits (e.g., "XXXX-XXXX-4921").
 */
export function maskBankAccount(account: string | null | undefined): string {
  if (!account) return "XXXX-XXXX-XXXX";
  const clean = account.replace(/\s+/g, "");
  if (clean.length < 4) return "XXXX-XXXX-XXXX";
  return `XXXX-XXXX-${clean.slice(-4)}`;
}

/**
 * Recursively sanitizes an audit payload or metadata object by removing or masking
 * any keys matching sensitive credentials, tokens, or raw PII identifiers.
 */
export function sanitizeAuditPayload(
  payload: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    const lowerKey = key.toLowerCase().replace(/[-_]/g, "");

    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = "[REDACTED]";
      continue;
    }

    if (lowerKey.includes("aadhaar")) {
      sanitized[key] = maskAadhaar(String(value));
      continue;
    }

    if (lowerKey.includes("accountnumber") || lowerKey.includes("bankaccount")) {
      sanitized[key] = maskBankAccount(String(value));
      continue;
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      sanitized[key] = sanitizeAuditPayload(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        item && typeof item === "object"
          ? sanitizeAuditPayload(item as Record<string, unknown>)
          : item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitizes system errors to ensure sensitive stack traces, DB connection strings,
 * and system paths are never surfaced to client-facing API responses.
 */
export function sanitizeErrorMessage(error: unknown, fallback = "An error occurred"): string {
  if (error instanceof Error) {
    let msg = error.message;

    // Redact postgres connection strings
    msg = msg.replace(/postgresql:\/\/[^@]+@[^/]+/gi, "postgresql://[REDACTED_CREDENTIALS]");

    // Redact absolute local paths
    msg = msg.replace(/[A-Z]:\\[^\s:;,]+/gi, "[REDACTED_PATH]");
    msg = msg.replace(/\/home\/[^\s:;,]+/gi, "[REDACTED_PATH]");

    return msg;
  }

  return fallback;
}
