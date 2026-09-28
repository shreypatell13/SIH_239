import { UserRole } from "@prisma/client";
import { assertActiveUser, AuthenticatedUser } from "./roles";

export function assertOperationsAccess(user: AuthenticatedUser | null | undefined): void {
  assertActiveUser(user);
  if (user.role !== UserRole.OPERATIONS_DIRECTOR) {
    throw new Error("Forbidden: Operations Director access is required.");
  }
}
