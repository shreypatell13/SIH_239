import { RenewalStatus, ScholarStatus } from "@prisma/client";

export class PostSelectionLifecyclePolicy {
  /**
   * Check if a renewal transition from currentStatus to nextStatus is valid.
   */
  public static isValidRenewalTransition(
    currentStatus: RenewalStatus,
    nextStatus: RenewalStatus
  ): boolean {
    const validTransitions: Record<RenewalStatus, RenewalStatus[]> = {
      UPCOMING: [RenewalStatus.DRAFT, RenewalStatus.SUBMITTED, RenewalStatus.UNDER_REVIEW],
      DRAFT: [RenewalStatus.SUBMITTED],
      SUBMITTED: [
        RenewalStatus.UNDER_REVIEW,
        RenewalStatus.DEFICIENT,
        RenewalStatus.APPROVED,
        RenewalStatus.REJECTED,
      ],
      UNDER_REVIEW: [RenewalStatus.DEFICIENT, RenewalStatus.APPROVED, RenewalStatus.REJECTED],
      DEFICIENT: [RenewalStatus.SUBMITTED, RenewalStatus.UNDER_REVIEW, RenewalStatus.REJECTED],
      APPROVED: [RenewalStatus.COMPLETED],
      REJECTED: [],
      COMPLETED: [],
    };

    return validTransitions[currentStatus]?.includes(nextStatus) ?? false;
  }

  /**
   * Determine corresponding ScholarStatus given active renewal states.
   */
  public static deriveScholarStatus(
    totalTenureYears: number,
    currentYear: number,
    activeRenewals: Array<{ status: RenewalStatus; renewalCycle: number }>
  ): ScholarStatus {
    if (
      currentYear >= totalTenureYears &&
      activeRenewals.every(
        (r) => r.status === RenewalStatus.APPROVED || r.status === RenewalStatus.COMPLETED
      )
    ) {
      return ScholarStatus.COMPLETED;
    }

    const hasDeficient = activeRenewals.some((r) => r.status === RenewalStatus.DEFICIENT);
    if (hasDeficient) {
      return ScholarStatus.ON_HOLD;
    }

    const hasDue = activeRenewals.some(
      (r) => r.status === RenewalStatus.UPCOMING || r.status === RenewalStatus.DRAFT
    );
    if (hasDue) {
      return ScholarStatus.RENEWAL_DUE;
    }

    return ScholarStatus.ACTIVE;
  }
}
