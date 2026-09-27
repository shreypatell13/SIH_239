import { redirect } from "next/navigation";
import { getServerAuthUser } from "@/server/auth/session";
import { ForbiddenPage } from "@/components/auth/forbidden-page";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerAuthUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "SCHEME_ADMIN") {
    return (
      <ForbiddenPage
        requiredRole="SCHEME_ADMIN"
        actualRole={user.role}
        resourceTitle="Scheme Studio (Admin Console)"
      />
    );
  }

  return <>{children}</>;
}
