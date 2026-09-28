import React from "react";
import Link from "next/link";
import { getServerAuthUser } from "@/server/auth/session";
import { applicationService } from "@/server/services/application.service";
import { schemeService } from "@/server/services/scheme.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building2,
  FolderOpen,
} from "lucide-react";

export default async function ApplicantDashboardPage() {
  const user = await getServerAuthUser();
  const applications = user ? await applicationService.listApplications(user).catch(() => []) : [];
  const activeSchemes = await schemeService.listActiveSchemes().catch(() => []);

  return (
    <div className="mx-auto max-w-6xl space-y-8" data-testid="applicant-dashboard">
      {/* Header Banner */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-gov-navy to-slate-800 p-6 text-white shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Applicant Portal</h1>
              <Badge variant="outline" className="border-white/30 text-xs text-white">
                Scheduled Tribe Candidate
              </Badge>
            </div>
            <p className="text-sm text-slate-200">
              Welcome, <strong>{user?.name || "Candidate"}</strong>. Track your scholarship
              applications and case milestones.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/applicant/profile">
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 bg-white/10 text-xs text-white hover:bg-white/20"
              >
                Candidate Profile
              </Button>
            </Link>
            <Link href="/applicant/schemes">
              <Button
                size="sm"
                className="flex items-center gap-1.5 bg-emerald-600 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                <PlusCircle className="h-4 w-4" />
                Apply for Scholarship
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Applications Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-gov-navy" />
            <h2 className="text-lg font-bold text-slate-900">My Scholarship Applications</h2>
          </div>
          <span className="text-xs text-slate-500">{applications.length} Application(s)</span>
        </div>

        {applications.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {applications.map((app) => (
              <Card
                key={app.id}
                className="border-slate-200 transition-shadow hover:shadow-md"
                data-testid={`app-card-${app.schemeCode}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="font-mono text-xs font-bold text-gov-navy"
                        >
                          {app.schemeCode}
                        </Badge>
                        <Badge
                          variant={
                            app.status === "SUBMITTED"
                              ? "success"
                              : app.status === "DRAFT"
                                ? "warning"
                                : "destructive"
                          }
                        >
                          {app.status}
                        </Badge>
                      </div>
                      <CardTitle className="mt-2 text-base font-bold text-slate-900">
                        {app.schemeName}
                      </CardTitle>
                    </div>
                  </div>
                  <CardDescription className="font-mono text-xs text-slate-500">
                    App No: {app.applicationNumber}
                    {app.caseNumber && ` • Case: ${app.caseNumber}`}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 text-xs">
                  {/* Progress Indicators */}
                  <div className="grid grid-cols-2 gap-2 rounded-md bg-slate-50 p-3">
                    <div>
                      <span className="text-slate-500">Form Progress</span>
                      <p className="text-sm font-bold text-slate-800">
                        {app.formCompletionPercent}%
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Documents</span>
                      <p className="text-sm font-bold text-slate-800">
                        {app.documentsUploadedCount} Uploaded
                      </p>
                    </div>
                  </div>

                  {app.status === "SUBMITTED" && (
                    <div className="rounded-md border border-emerald-100 bg-emerald-50/50 p-2.5 text-slate-700">
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                        <ShieldCheck className="h-4 w-4" />
                        Stage: {app.caseStage || "SUBMITTED"}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-600">
                        Next Action: {app.nextAction || "Automated verification underway."}
                      </p>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-[11px] text-slate-400">
                    Updated {new Date(app.updatedAt).toLocaleDateString("en-IN")}
                  </span>

                  {app.status === "DRAFT" ? (
                    <Link href={`/applicant/applications/${app.id}`}>
                      <Button
                        size="sm"
                        className="flex items-center gap-1 bg-gov-navy text-xs text-white hover:bg-gov-navy/90"
                      >
                        Resume Application
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/applicant/applications/${app.id}/status`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 border-gov-navy text-xs text-gov-navy"
                      >
                        View Live Status
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-400" />
            <h3 className="mt-2 text-base font-semibold text-slate-800">No Applications Yet</h3>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
              You have not started any scholarship applications. Explore available national
              fellowship and overseas scholarship schemes below.
            </p>
            <div className="mt-4">
              <Link href="/applicant/schemes">
                <Button size="sm" className="bg-gov-navy text-xs text-white hover:bg-gov-navy/90">
                  Explore Schemes &amp; Apply
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Available Schemes Section */}
      <div className="space-y-4 border-t border-slate-200 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gov-navy" />
            <h2 className="text-lg font-bold text-slate-900">Active Ministry Schemes</h2>
          </div>
          <Link
            href="/applicant/schemes"
            className="text-xs font-semibold text-gov-navy hover:underline"
          >
            View All Schemes &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {activeSchemes.map((scheme) => (
            <Card key={scheme.id} className="flex flex-col justify-between border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-xs font-bold">
                    {scheme.code}
                  </Badge>
                  <Badge variant="success">Active Window</Badge>
                </div>
                <CardTitle className="mt-2 text-base">{scheme.name}</CardTitle>
                <CardDescription className="line-clamp-2 text-xs">
                  {scheme.description}
                </CardDescription>
              </CardHeader>

              <CardFooter className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-[11px] text-slate-500">
                  {scheme.applicationDeadline
                    ? `Deadline: ${new Date(scheme.applicationDeadline).toLocaleDateString("en-IN")}`
                    : "Continuous cycle"}
                </span>

                <Link href={`/applicant/schemes/${scheme.code}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gov-navy text-xs text-gov-navy hover:bg-gov-navy/5"
                  >
                    View Details &amp; Apply
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
