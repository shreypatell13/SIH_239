import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerAuthUser } from "@/server/auth/session";
import { schemeService } from "@/server/services/scheme.service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Layers,
  FileText,
  FileCheck,
  Scale,
  GitFork,
  Award,
  Calendar,
  Code2,
} from "lucide-react";

interface Props {
  params: {
    schemeId: string;
    versionId: string;
  };
}

export default async function ViewSchemeVersionPage({ params }: Props) {
  const user = await getServerAuthUser();
  if (!user) return notFound();

  const [scheme, version] = await Promise.all([
    schemeService.getSchemeById(params.schemeId, user),
    schemeService.getVersionById(params.versionId, user),
  ]);

  if (!scheme || !version) return notFound();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href={`/admin/schemes/${scheme.id}`}>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                <ArrowLeft className="h-3 w-3" />
                <span>{scheme.code} Overview</span>
              </Button>
            </Link>
            <Badge className="bg-slate-900 font-mono text-[10px]">
              Version {version.versionNumber}
            </Badge>
            {version.isActive ? (
              <Badge className="gap-1 bg-emerald-600 text-[10px]">
                <CheckCircle2 className="h-3 w-3" />
                <span>Active Version</span>
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
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {scheme.name} — Version {version.versionNumber} Specification
          </h1>
        </div>

        <Link href={`/admin/schemes/${scheme.id}/versions/new`}>
          <Button size="sm" className="gap-1.5 bg-gov-slate text-xs hover:bg-slate-800">
            <Layers className="h-3.5 w-3.5" />
            <span>Draft New Version from this</span>
          </Button>
        </Link>
      </div>

      {/* Version Metadata Header */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="shadow-2xs border-slate-200 p-3">
          <span className="block text-[11px] font-semibold text-slate-500">Published By</span>
          <span className="text-xs font-bold text-slate-900">
            {version.publishedByName || "System"}
          </span>
        </Card>
        <Card className="shadow-2xs border-slate-200 p-3">
          <span className="block text-[11px] font-semibold text-slate-500">Published Date</span>
          <span className="text-xs font-bold text-slate-900">
            {new Date(version.publishedAt).toLocaleDateString()}
          </span>
        </Card>
        <Card className="shadow-2xs border-slate-200 p-3">
          <span className="block text-[11px] font-semibold text-slate-500">
            Application Deadline
          </span>
          <span className="text-xs font-bold text-slate-900">
            {version.applicationDeadline
              ? new Date(version.applicationDeadline).toLocaleDateString()
              : "Open"}
          </span>
        </Card>
        <Card className="shadow-2xs border-slate-200 p-3">
          <span className="block text-[11px] font-semibold text-slate-500">Total Applications</span>
          <span className="text-xs font-bold text-slate-900">
            {version.totalApplicationsCount ?? 0}
          </span>
        </Card>
      </div>

      {/* 1. Form Schema Specification */}
      <Card className="shadow-xs border-slate-200">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-gov-slate" />
            <span>1. Dynamic Form Schema ({version.formSchema?.fields?.length ?? 0} Fields)</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Sections and input elements rendered dynamically for ST applicants.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {version.formSchema?.sections?.map((section) => {
            const sectionFields =
              version.formSchema?.fields?.filter((f) => f.sectionId === section.id) ?? [];
            return (
              <div
                key={section.id}
                className="space-y-2 rounded-md border border-slate-200 bg-slate-50/50 p-3.5"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    Section: {section.id}
                  </Badge>
                  <h4 className="text-xs font-bold text-slate-900">{section.title}</h4>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2 lg:grid-cols-3">
                  {sectionFields.map((f) => (
                    <div
                      key={f.id}
                      className="space-y-1 rounded border border-slate-200 bg-white p-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{f.label}</span>
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {f.type}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-mono">{f.id}</span>
                        <span>{f.validation?.required ? "Mandatory" : "Optional"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 2. Document Matrix */}
      <Card className="shadow-xs border-slate-200">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCheck className="h-4 w-4 text-gov-slate" />
            <span>
              2. Document Requirements Matrix (
              {version.documentRequirements?.requirements?.length ?? 0} Documents)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {version.documentRequirements?.requirements?.map((req) => (
              <div
                key={req.id}
                className="space-y-2 rounded-lg border border-slate-200 bg-white p-3.5"
              >
                <div className="flex items-center justify-between">
                  <Badge className="bg-slate-900 font-mono text-[10px]">{req.documentType}</Badge>
                  <Badge
                    variant={req.level === "MANDATORY" ? "default" : "outline"}
                    className="text-[10px]"
                  >
                    {req.level}
                  </Badge>
                </div>
                <h4 className="text-xs font-bold text-slate-900">{req.label}</h4>
                <p className="text-[11px] text-slate-600">{req.description}</p>
                <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 text-[10px] text-slate-500">
                  <span>Max: {req.maxFileSizeMb} MB</span>
                  <span>MIME: {req.allowedMimeTypes.join(", ")}</span>
                  {req.validityWindowMonths && <span>Valid: {req.validityWindowMonths}m</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3. Eligibility Rules */}
      <Card className="shadow-xs border-slate-200">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="h-4 w-4 text-gov-slate" />
            <span>
              3. Eligibility Rules DSL ({version.eligibilityRules?.rules?.length ?? 0} Rules)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-2">
            {version.eligibilityRules?.rules?.map((r) => (
              <div
                key={r.ruleKey}
                className="flex flex-col gap-2 rounded-md border border-slate-200 bg-slate-50/50 p-3 text-xs sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {r.ruleKey}
                    </Badge>
                    <span className="font-bold text-slate-900">{r.name}</span>
                    <Badge
                      className={
                        r.severity === "HARD_FAIL"
                          ? "bg-rose-700 text-[9px]"
                          : "bg-amber-600 text-[9px]"
                      }
                    >
                      {r.severity}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-600">{r.description}</p>
                  <p className="font-mono text-[10px] text-slate-500">
                    Assertion: {r.source}.{r.sourceField} {r.operator} {String(r.threshold)}
                  </p>
                </div>
                <div className="text-right sm:max-w-xs">
                  <span className="block text-[10px] italic text-slate-500">
                    {r.failureMessage}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 4. Workflow & SLAs */}
      {version.workflowConfig && (
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <GitFork className="h-4 w-4 text-gov-slate" />
              <span>
                4. Workflow &amp; SLA Milestones ({version.workflowConfig.stages.length} Stages)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              {version.workflowConfig.stages.map((stg, i) => (
                <div key={stg.stageKey} className="flex items-center gap-2">
                  <div className="rounded-md border border-slate-200 bg-white p-2.5 text-xs">
                    <span className="block font-mono text-[10px] text-slate-400">
                      Stage {stg.order || i + 1}
                    </span>
                    <span className="font-bold text-slate-900">{stg.label}</span>
                    <span className="block text-[10px] text-slate-500">
                      SLA: {stg.slaDays} day(s)
                    </span>
                  </div>
                  {i < version.workflowConfig!.stages.length - 1 && (
                    <span className="text-slate-400">&rarr;</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-4 border-t border-slate-100 pt-2 text-xs text-slate-500">
              <span>
                Deficiency Window:{" "}
                <strong>{version.workflowConfig.deficiencyResponseWindowDays} days</strong>
              </span>
              <span>
                Max Resubmissions: <strong>{version.workflowConfig.maxResubmissionAttempts}</strong>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. Selection & Grants */}
      {version.selectionConfig && (
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4 text-gov-slate" />
              <span>5. Financial Grants &amp; Selection Criteria</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
              <span>
                Maximum Total Sanctions:{" "}
                <strong>{version.selectionConfig.maxAwardees} Scholars</strong>
              </span>
              <span>
                Merit Ranking: <strong>{version.selectionConfig.meritBasis}</strong>
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
              {version.selectionConfig.financialComponents.map((fc) => (
                <div
                  key={fc.id}
                  className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 p-2.5"
                >
                  <div>
                    <span className="block font-bold text-slate-800">{fc.label}</span>
                    <span className="text-[10px] uppercase text-slate-500">{fc.frequency}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{fc.amountInr.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw JSON Debug Viewer */}
      <Card className="shadow-xs border-slate-200 bg-slate-900 text-slate-100">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 font-mono text-xs text-emerald-400">
            <Code2 className="h-3.5 w-3.5" />
            <span>Complete Immutable JSON Payload</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="max-h-72 overflow-x-auto rounded border border-slate-800 bg-slate-950 p-3 font-mono text-[11px]">
            {JSON.stringify(version, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
