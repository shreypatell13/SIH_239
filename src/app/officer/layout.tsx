import { redirect } from "next/navigation";
import { getServerAuthUser } from "@/server/auth/session";
import { ForbiddenPage } from "@/components/auth/forbidden-page";

export default async function OfficerLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerAuthUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "VERIFICATION_OFFICER") {
    return (
      <ForbiddenPage
        requiredRole="VERIFICATION_OFFICER"
        actualRole={user.role}
        resourceTitle="Officer Case Workspace"
      />
    );
  }

  return <>{children}</>;
}
