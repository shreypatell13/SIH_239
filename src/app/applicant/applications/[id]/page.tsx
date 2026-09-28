"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ApplicationDetailDTO } from "@/server/domain/application/types";
import { DynamicFormWizard } from "@/components/application/dynamic-form-wizard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, FileStack, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function ApplicationFormWizardPage() {
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

  // If already submitted, redirect to status page
  if (application.status !== "DRAFT") {
    return (
      <div className="mx-auto max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <ShieldAlert className="mx-auto h-12 w-12 text-gov-navy" />
        <h2 className="text-xl font-bold text-slate-900">Application Already Submitted</h2>
        <p className="text-xs text-slate-600">
          This application is in <strong>{application.status}</strong> status and cannot be edited.
        </p>
        <Link href={`/applicant/applications/${applicationId}/status`}>
          <Button className="bg-gov-navy text-xs text-white">View Live Status &rarr;</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6" data-testid="application-wizard-page">
      {/* Top Banner with Scheme Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/applicant">
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
              Application No: {application.applicationNumber} &bull; Version{" "}
              {application.versionNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/applicant/applications/${applicationId}/documents`}>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 border-slate-300 text-xs"
            >
              <FileStack className="h-3.5 w-3.5" />
              Document Checklist
            </Button>
          </Link>
        </div>
      </div>

      {/* Dynamic Form Wizard Component */}
      <DynamicFormWizard
        applicationId={applicationId}
        formSchema={application.schemeVersion.formSchema}
        initialData={application.formData}
        onProceedToDocuments={() => {
          router.push(`/applicant/applications/${applicationId}/documents`);
        }}
      />
    </div>
  );
}
