"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ApplicationDetailDTO } from "@/server/domain/application/types";
import { ReadinessReport } from "@/components/application/readiness-report";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ApplicationReadinessPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = String(params.id);

  const [application, setApplication] = useState<ApplicationDetailDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/applicant/applications/${applicationId}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success || !json.data) {
          throw new Error(json.error?.message || "Failed to load application");
        }
        setApplication(json.data);
      })
      .catch((err) => {
        setErrorMsg(err.message || "Failed to load application details");
      })
      .finally(() => setIsLoading(false));
  }, [applicationId]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gov-navy" />
      </div>
    );
  }

  if (!application || errorMsg) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Link href="/applicant">
          <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
          {errorMsg || "Application not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6" data-testid="application-readiness-page">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link href={`/applicant/applications/${applicationId}/documents`}>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs font-bold text-gov-navy">
                {application.schemeCode}
              </Badge>
              <h1 className="text-xl font-bold text-slate-900">{application.schemeName}</h1>
            </div>
            <p className="font-mono text-xs text-slate-500">
              App No: {application.applicationNumber} &bull; Pre-Submission Readiness Review
            </p>
          </div>
        </div>
      </div>

      {/* Readiness Report Component */}
      <ReadinessReport
        applicationId={applicationId}
        onBackToDocuments={() => router.push(`/applicant/applications/${applicationId}/documents`)}
        onBackToForm={() => router.push(`/applicant/applications/${applicationId}`)}
        onSubmitSuccess={() => {
          router.push(`/applicant/applications/${applicationId}/status`);
        }}
      />
    </div>
  );
}
