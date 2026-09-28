import { getServerAuthUser } from "@/server/auth/session";
import { officerService } from "@/server/services/officer.service";
import { CaseQueueTable } from "@/components/officer/case-queue-table";
import { OfficerQueueResponseDTO } from "@/server/domain/officer/types";

export default async function OfficerWorkspacePage() {
  const user = await getServerAuthUser();

  let initialData: OfficerQueueResponseDTO = {
    total: 0,
    page: 1,
    pageSize: 20,
    items: [],
    counts: {
      totalAssigned: 0,
      actionRequired: 0,
      deficiencyPending: 0,
      readyForReview: 0,
    },
  };

  if (user) {
    try {
      initialData = await officerService.listCaseQueue(
        {
          schemeCode: "ALL",
          sortBy: "oldestSubmission",
          page: 1,
          pageSize: 20,
        },
        user
      );
    } catch {
      // Fall back to empty initial data if service threw
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Officer Case Workspace
          </h1>
          <p className="text-sm text-slate-500">
            Split-screen verification, evidence inspection, and human-in-the-loop decision desk.
          </p>
        </div>
      </div>

      <CaseQueueTable initialData={initialData} currentOfficerName={user?.name} />
    </div>
  );
}
