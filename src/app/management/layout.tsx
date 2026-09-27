import { redirect } from "next/navigation";
import { getServerAuthUser } from "@/server/auth/session";
import { ForbiddenPage } from "@/components/auth/forbidden-page";

export default async function ManagementLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerAuthUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "OPERATIONS_DIRECTOR") {
    return (
      <ForbiddenPage
        requiredRole="OPERATIONS_DIRECTOR"
        actualRole={user.role}
        resourceTitle="Operations Control Tower"
      />
    );
  }

  return <>{children}</>;
}
