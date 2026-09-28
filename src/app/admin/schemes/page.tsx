import Link from "next/link";
import { getServerAuthUser } from "@/server/auth/session";
import { schemeService } from "@/server/services/scheme.service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Settings2,
  Plus,
  ArrowRight,
  Layers,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCode2,
} from "lucide-react";

export default async function AdminSchemesPage() {
  const user = await getServerAuthUser();
  const schemes = user ? await schemeService.listAllSchemes(user) : [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="shadow-xs mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
            <Settings2 className="h-3.5 w-3.5 text-gov-saffron" />
            <span className="font-medium">Declarative Policy &amp; Configuration Engine</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Scheme Studio
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Configure dynamic application forms, document requirements, eligibility rules, and
            workflows without code modifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/schemes/new">
            <Button className="gap-2 bg-gov-slate hover:bg-slate-800">
              <Plus className="h-4 w-4" />
              <span>Create New Scheme</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Scheme Metrics Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-slate-500">
              ACTIVE SCHEMES
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900">
              {schemes.filter((s) => s.isActive).length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">
              Currently accepting student applications under active version policy
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-slate-500">
              TOTAL SCHEMES
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-slate-900">{schemes.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">
              Registered scholarship &amp; fellowship programs (NFST, NOS, etc.)
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-slate-500">
              ENGINE PRINCIPLE
            </CardDescription>
            <CardTitle className="flex items-center gap-1.5 pt-1 text-sm font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              <span>Single Orchestration Engine</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-500">
              Behavior configured via versioned JSON schemas (Zero hardcoded rules)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Schemes List */}
      <Card className="shadow-xs border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Configured Scholarship Programs</CardTitle>
          <CardDescription className="text-xs">
            Select a scheme to inspect versions, edit form schemas, modify eligibility thresholds,
            or publish updates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-200">
            {schemes.map((scheme) => (
              <div
                key={scheme.id}
                className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="max-w-2xl space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <Badge className="bg-slate-900 font-mono text-xs">{scheme.code}</Badge>
                    <h3 className="text-base font-bold text-slate-900">{scheme.name}</h3>
                    {scheme.isActive ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-500 bg-emerald-50 text-[10px] text-emerald-700"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-slate-300 text-[10px] text-slate-500"
                      >
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="line-clamp-2 text-xs text-slate-600">{scheme.description}</p>

                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-slate-400" />
                      <span>{scheme.totalVersionsCount} Version(s)</span>
                    </span>
                    {scheme.activeVersionNumber && (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>
                          Active: <strong>v{scheme.activeVersionNumber}</strong>
                        </span>
                      </span>
                    )}
                    {scheme.applicationDeadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          Deadline: {new Date(scheme.applicationDeadline).toLocaleDateString()}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {scheme.activeVersionId && (
                    <Link href={`/admin/schemes/${scheme.id}/versions/${scheme.activeVersionId}`}>
                      <Button variant="outline" size="sm" className="gap-1 text-xs">
                        <FileCode2 className="h-3.5 w-3.5" />
                        <span>View Config</span>
                      </Button>
                    </Link>
                  )}
                  <Link href={`/admin/schemes/${scheme.id}`}>
                    <Button size="sm" className="gap-1 bg-gov-slate text-xs hover:bg-slate-800">
                      <span>Manage Scheme</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}

            {schemes.length === 0 && (
              <div className="space-y-2 py-8 text-center text-slate-500">
                <AlertCircle className="mx-auto h-8 w-8 text-slate-400" />
                <p className="text-sm">No scholarship schemes configured yet.</p>
                <Link href="/admin/schemes/new">
                  <Button size="sm" className="mt-2">
                    Create First Scheme
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
