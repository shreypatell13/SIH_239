import { getServerAuthUser } from "@/server/auth/session";
import { assertOperationsAccess } from "@/server/auth/operations-access";
import { operationsAnalyticsService } from "@/server/services/operations-analytics.service";
import { OperationsDashboardClient } from "@/components/operations/operations-dashboard-client";
import { schemeService } from "@/server/services/scheme.service";
import { redirect } from "next/navigation";

export default async function ManagementControlTowerPage() {
  const user = await getServerAuthUser();
  if (!user) {
    redirect("/login?callbackUrl=/management");
  }

  assertOperationsAccess(user);

  const [initialOverview, initialBottlenecks, schemes] = await Promise.all([
    operationsAnalyticsService.getOverview({}),
    operationsAnalyticsService.getBottlenecks({}),
    schemeService.listActiveSchemes(),
  ]);

  return (
    <OperationsDashboardClient
      initialOverview={initialOverview}
      initialBottlenecks={initialBottlenecks}
      userName={user.name}
      userRole={user.role}
      schemes={schemes.map(({ code, name }) => ({ code, name }))}
    />
  );
}
