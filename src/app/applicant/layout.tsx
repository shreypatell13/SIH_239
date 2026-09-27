import { redirect } from "next/navigation";
import { getServerAuthUser } from "@/server/auth/session";
import { ForbiddenPage } from "@/components/auth/forbidden-page";

export default async function ApplicantLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerAuthUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "APPLICANT") {
    return (
      <ForbiddenPage
        requiredRole="APPLICANT"
        actualRole={user.role}
        resourceTitle="Applicant Portal"
      />
    );
  }

  return <>{children}</>;
}
