import { ZodError } from "zod";
import { apiError } from "../api-response";

export function operationsApiError(error: unknown) {
  if (error instanceof ZodError) {
    return apiError("Invalid operations query parameters.", "BAD_REQUEST", 400);
  }
  const message = error instanceof Error ? error.message : "";
  if (message.startsWith("Forbidden:")) {
    return apiError("Operations access is not permitted.", "FORBIDDEN", 403);
  }
  if (message.startsWith("Unauthorized:")) {
    return apiError("Authentication is required.", "UNAUTHORIZED", 401);
  }
  return apiError("Unable to load operations data.", "INTERNAL_SERVER_ERROR", 500);
}
