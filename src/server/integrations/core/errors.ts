/**
 * Integration Errors Hierarchy
 * Phase 2L: Integration Adapters & Security Hardening
 *
 * Provides typed, classified errors for external system operations
 * with explicit retryability and sanitized logging contracts.
 */

export abstract class IntegrationError extends Error {
  public abstract readonly code: string;
  public abstract readonly isRetryable: boolean;
  public readonly providerId: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    providerId: string,
    message: string,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(`[${providerId.toUpperCase()}_INTEGRATION] ${message}`);
    this.name = "IntegrationError";
    this.providerId = providerId;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class IntegrationTimeoutError extends IntegrationError {
  public readonly code = "INTEGRATION_TIMEOUT";
  public readonly isRetryable = true;

  constructor(providerId: string, timeoutMs: number) {
    super(providerId, `Operation timed out after ${timeoutMs}ms`, 504, { timeoutMs });
    this.name = "IntegrationTimeoutError";
  }
}

export class IntegrationUnavailableError extends IntegrationError {
  public readonly code = "INTEGRATION_UNAVAILABLE";
  public readonly isRetryable = true;

  constructor(providerId: string, reason?: string) {
    super(providerId, reason || "External provider service is currently unavailable", 503);
    this.name = "IntegrationUnavailableError";
  }
}

export class IntegrationValidationError extends IntegrationError {
  public readonly code = "INTEGRATION_VALIDATION_ERROR";
  public readonly isRetryable = false;

  constructor(providerId: string, reason: string, details?: Record<string, unknown>) {
    super(providerId, `Validation failed: ${reason}`, 400, details);
    this.name = "IntegrationValidationError";
  }
}

export class IntegrationAuthError extends IntegrationError {
  public readonly code = "INTEGRATION_AUTH_ERROR";
  public readonly isRetryable = false;

  constructor(providerId: string, reason: string = "Invalid or expired provider credentials") {
    super(providerId, `Authentication failed: ${reason}`, 401);
    this.name = "IntegrationAuthError";
  }
}

export class IntegrationMalformedResponseError extends IntegrationError {
  public readonly code = "INTEGRATION_MALFORMED_RESPONSE";
  public readonly isRetryable = false;

  constructor(providerId: string, reason: string) {
    super(providerId, `Malformed response received: ${reason}`, 502);
    this.name = "IntegrationMalformedResponseError";
  }
}
