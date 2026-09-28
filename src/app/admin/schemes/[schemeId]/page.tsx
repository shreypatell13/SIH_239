import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerAuthUser } from "@/server/auth/session";
import { schemeService } from "@/server/services/scheme.service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Plus,
  Layers,
  Calendar,
  CheckCircle2,
  FileCode2,
  Lock,
  Clock,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

interface Props {
  params: {
    schemeId: string;
  };
}

export default async function SchemeDetailPage({ params }: Props) {
  const user = await getServerAuthUser();
  if (!user) return notFound();

  const scheme = await schemeService.getSchemeById(params.schemeId, user);
  if (!scheme) return notFound();

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center gap-2">
        <Link href="/admin/schemes">
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>All Schemes</span>
          </Button>
        </Link>
      </div>

      {/* Scheme Metadata Card */}
      <Card className="shadow-xs border-slate-200">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <Badge className="bg-slate-900 px-2.5 py-0.5 font-mono text-sm">
                  {scheme.code}
                </Badge>
                <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{scheme.name}</h1>
                {scheme.isActive ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-500 bg-emerald-50 text-xs text-emerald-700"
                  >
                    Active Program
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-slate-300 text-xs text-slate-500">
                    Inactive
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500">{scheme.ministry}</p>
            </div>

            <Link href={`/admin/schemes/${scheme.id}/versions/new`}>
              <Button className="gap-1.5 bg-gov-slate text-xs hover:bg-slate-800">
                <Plus className="h-4 w-4" />
                <span>Draft New Version</span>
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
            {scheme.description}
          </p>
        </CardContent>
      </Card>

      {/* Version History Table */}
      <Card className="shadow-xs border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers className="h-5 w-5 text-gov-slate" />
                <span>Scheme Version History</span>
              </CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                All published versions are immutable. Publishing a new version atomically supersedes
                the active version.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              {scheme.versions.length} Total Versions
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-700">
                <tr>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Published By</th>
                  <th className="px-4 py-3">Published Date</th>
                  <th className="px-4 py-3">Application Window</th>
                  <th className="px-4 py-3">Applications</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {scheme.versions.map((ver) => (
                  <tr key={ver.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                      v{ver.versionNumber}
                    </td>
                    <td className="px-4 py-3.5">
                      {ver.isActive ? (
                        <Badge className="gap-1 bg-emerald-600 text-[10px] hover:bg-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Active / Current</span>
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="gap-1 border-slate-300 text-[10px] text-slate-500"
                        >
                          <Lock className="h-3 w-3" />
                          <span>Superseded (Immutable)</span>
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      {ver.publishedByName || "System Initial"}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {new Date(ver.publishedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {ver.applicationDeadline ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>
                            Closes: {new Date(ver.applicationDeadline).toLocaleDateString()}
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400">Open until superseded</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-900">
                        {ver.totalApplicationsCount ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link href={`/admin/schemes/${scheme.id}/versions/${ver.id}`}>
                        <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px]">
                          <FileCode2 className="h-3 w-3" />
                          <span>Inspect DSL</span>
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
