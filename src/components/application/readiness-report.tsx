"use client";

import React, { useState, useEffect } from "react";
import { ReadinessReportDTO } from "@/server/domain/application/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  FileCheck,
  Calendar,
  Send,
  Loader2,
  ArrowLeft,
  Info,
} from "lucide-react";

interface ReadinessReportProps {
  applicationId: string;
  onBackToDocuments: () => void;
  onBackToForm: () => void;
  onSubmitSuccess: () => void;
}

export function ReadinessReport({
  applicationId,
  onBackToDocuments,
  onBackToForm,
  onSubmitSuccess,
}: ReadinessReportProps) {
  const [report, setReport] = useState<ReadinessReportDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchReadiness = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/applicant/applications/${applicationId}/readiness`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to load readiness report");
      }
      setReport(json.data);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to load readiness");
    } finally {
      setIsLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchReadiness();
  }, [fetchReadiness]);

  const handleSubmit = async () => {
    if (!report?.canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/applicant/applications/${applicationId}/submit`, {
        method: "POST",
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Submission failed");
      }

      onSubmitSuccess();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Error submitting application");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-white p-8">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-gov-navy" />
          <span className="text-sm font-medium">Checking application readiness...</span>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
        {submitError || "Unable to load readiness report."}
      </div>
    );
  }

  const { overallStatus, canSubmit, formReadiness, documentReadiness, windowStatus } = report;

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div
        className={`rounded-xl border p-6 ${
          overallStatus === "READY"
            ? "border-emerald-300 bg-emerald-50/50"
            : overallStatus === "ACTION_REQUIRED"
              ? "border-amber-300 bg-amber-50/50"
              : "border-rose-300 bg-rose-50/50"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {overallStatus === "READY" ? (
              <CheckCircle2 className="h-8 w-8 flex-shrink-0 text-emerald-600" />
            ) : overallStatus === "ACTION_REQUIRED" ? (
              <AlertTriangle className="h-8 w-8 flex-shrink-0 text-amber-600" />
            ) : (
              <XCircle className="h-8 w-8 flex-shrink-0 text-rose-600" />
            )}

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  {overallStatus === "READY"
                    ? "Application Ready for Submission"
                    : overallStatus === "ACTION_REQUIRED"
                      ? "Action Required Before Submission"
                      : "Application Incomplete"}
                </h2>
                <Badge
                  variant={
                    overallStatus === "READY"
                      ? "success"
                      : overallStatus === "ACTION_REQUIRED"
                        ? "warning"
                        : "destructive"
                  }
                >
                  {overallStatus}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {overallStatus === "READY"
                  ? "All mandatory fields and required documents are complete and verified."
                  : "Please address the pending items listed below before submitting your scholarship application."}
              </p>
            </div>
          </div>

          <Button
            size="lg"
            disabled={!canSubmit || isSubmitting}
            onClick={handleSubmit}
            className={`flex items-center gap-2 font-semibold shadow-md ${
              canSubmit
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "cursor-not-allowed bg-slate-300 text-slate-500"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting Application...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Final Submit Application
              </>
            )}
          </Button>
        </div>
      </div>

      {submitError && (
        <div className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-rose-600" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Grid of Readiness Checks */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* 1. Form Readiness */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gov-navy" />
                <CardTitle className="text-base">Form Fields</CardTitle>
              </div>
              <Badge variant={formReadiness.status === "COMPLETE" ? "success" : "destructive"}>
                {formReadiness.status}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              {formReadiness.completedFieldsCount} of {formReadiness.requiredFieldsCount} required
              fields filled
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {formReadiness.status === "COMPLETE" ? (
              <div className="flex items-center gap-2 font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                All mandatory form sections complete.
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-semibold text-rose-700">Missing Required Fields:</p>
                <ul className="list-disc space-y-1 pl-4 text-slate-700">
                  {formReadiness.missingFields.slice(0, 5).map((f) => (
                    <li key={f.id}>
                      <strong>{f.label}</strong> ({f.sectionTitle})
                    </li>
                  ))}
                  {formReadiness.missingFields.length > 5 && (
                    <li className="text-slate-500">
                      +{formReadiness.missingFields.length - 5} more fields
                    </li>
                  )}
                </ul>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBackToForm}
                  className="mt-2 w-full border-gov-navy text-xs text-gov-navy"
                >
                  Edit Form Fields
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. Document Readiness */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-gov-navy" />
                <CardTitle className="text-base">Documents</CardTitle>
              </div>
              <Badge variant={documentReadiness.status === "COMPLETE" ? "success" : "destructive"}>
                {documentReadiness.status}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              {documentReadiness.uploadedMandatoryCount} of {documentReadiness.totalMandatoryCount}{" "}
              mandatory uploaded
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {documentReadiness.status === "COMPLETE" ? (
              <div className="flex items-center gap-2 font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                All mandatory certificates uploaded.
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-semibold text-rose-700">Missing Mandatory Documents:</p>
                <ul className="list-disc space-y-1 pl-4 text-slate-700">
                  {documentReadiness.missingMandatory.map((doc, idx) => (
                    <li key={idx}>
                      <strong>{doc}</strong>
                    </li>
                  ))}
                  {documentReadiness.missingConditional.map((doc, idx) => (
                    <li key={`cond-${idx}`}>
                      <strong>{doc}</strong> (Conditional)
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBackToDocuments}
                  className="mt-2 w-full border-gov-navy text-xs text-gov-navy"
                >
                  Upload Missing Documents
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. Application Window */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gov-navy" />
                <CardTitle className="text-base">Application Window</CardTitle>
              </div>
              <Badge variant={windowStatus.isOpen ? "success" : "destructive"}>
                {windowStatus.isOpen ? "Active" : "Closed"}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              {windowStatus.daysRemaining !== null
                ? `${windowStatus.daysRemaining} days remaining`
                : "Continuous application window"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-slate-700">
            <p>{windowStatus.message}</p>
            {windowStatus.closesAt && (
              <div className="rounded bg-slate-50 p-2 font-mono text-[11px] text-slate-600">
                Deadline: {new Date(windowStatus.closesAt).toLocaleString("en-IN")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Guidance Alert */}
      <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-gov-navy" />
        <div>
          <p className="font-semibold text-slate-800">
            Important Notice on Application Submission:
          </p>
          <p className="mt-0.5">
            Once submitted, your application and Case Dossier will transition to the automated
            verification pipeline. Any discrepancies in documents will be transparently flagged as
            remediable deficiencies in Phase 2H rather than outright rejection.
          </p>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between border-t border-slate-200 pt-4">
        <Button variant="outline" onClick={onBackToDocuments} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Document Checklist
        </Button>
      </div>
    </div>
  );
}
