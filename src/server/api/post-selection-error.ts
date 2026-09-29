import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { apiError } from "../api-response";

export function postSelectionApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return apiError(
      "Validation failed for the supplied post-selection parameters.",
      "VALIDATION_ERROR",
      400,
      error.issues
    );
  }

  if (error instanceof Error) {
    if (error.message.includes("Unauthorized") || error.message.includes("No active session")) {
      return apiError(error.message, "UNAUTHORIZED", 401);
    }
    if (error.message.includes("Forbidden") || error.message.includes("Access denied")) {
      return apiError(error.message, "FORBIDDEN", 403);
    }
    if (error.message.includes("not found")) {
      return apiError(error.message, "NOT_FOUND", 404);
    }
    if (error.message.includes("already exists") || error.message.includes("Cannot submit")) {
      return apiError(error.message, "CONFLICT", 409);
    }
    return apiError(error.message, "BAD_REQUEST", 400);
  }

  return apiError("An unexpected server error occurred.", "INTERNAL_SERVER_ERROR", 500);
}
