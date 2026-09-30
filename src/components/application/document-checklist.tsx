"use client";

import React, { useState, useEffect } from "react";
import { ChecklistItemDTO } from "@/server/domain/application/types";
import { DocumentUploadCard } from "./document-upload-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowLeft, ArrowRight, Loader2, FileStack } from "lucide-react";

interface DocumentChecklistProps {
  applicationId: string;
  onBackToForm?: () => void;
  onProceedToReadiness?: () => void;
  disabled?: boolean;
}

export function DocumentChecklist({
  applicationId,
  onBackToForm,
  onProceedToReadiness,
  disabled = false,
}: DocumentChecklistProps) {
  const [checklist, setChecklist] = useState<ChecklistItemDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchChecklist = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/applicant/applications/${applicationId}/documents`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to load document checklist");
      }
      setChecklist(json.data || []);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error loading checklist");
    } finally {
      setIsLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

  // Check if any uploaded document is currently PENDING or PROCESSING
  const hasProcessingDocuments = checklist.some(
    (item) =>
      item.isUploaded &&
      (item.uploadedDocument?.processingStatus === "PENDING" ||
        item.uploadedDocument?.processingStatus === "PROCESSING")
  );

  // Automatically poll every 2.5 seconds while processing is in flight
  useEffect(() => {
    if (!hasProcessingDocuments) return;

    const interval = setInterval(() => {
      fetchChecklist();
    }, 2500);

    return () => clearInterval(interval);
  }, [hasProcessingDocuments, fetchChecklist]);

  const mandatoryItems = checklist.filter((item) => item.isRequired);
  const uploadedMandatory = mandatoryItems.filter((item) => item.isUploaded);
  const isAllMandatoryUploaded =
    mandatoryItems.length > 0 && uploadedMandatory.length === mandatoryItems.length;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-white p-8">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-gov-navy" />
          <span className="text-sm font-medium">Loading document requirements...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Progress Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gov-navy/10 text-gov-navy">
            <FileStack className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Document Checklist</h2>
            <p className="text-xs text-slate-500">
              Upload certificates and supporting documents according to scheme guidelines.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={isAllMandatoryUploaded ? "success" : "warning"}
            className="px-3 py-1 text-xs font-semibold"
          >
            {uploadedMandatory.length} of {mandatoryItems.length} Mandatory Uploaded
          </Badge>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {errorMsg}
        </div>
      )}

      {/* Document Upload Cards List */}
      <div className="space-y-4">
        {checklist.map((item) => (
          <DocumentUploadCard
            key={item.requirementId}
            applicationId={applicationId}
            item={item}
            onUploadSuccess={fetchChecklist}
            disabled={disabled}
          />
        ))}

        {checklist.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No document requirements specified for this scheme version.
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between border-t border-slate-200 pt-4">
        {onBackToForm && (
          <Button variant="outline" onClick={onBackToForm} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Application Form
          </Button>
        )}

        {onProceedToReadiness && (
          <Button
            onClick={onProceedToReadiness}
            className="ml-auto flex items-center gap-2 bg-gov-navy text-white hover:bg-gov-navy/90"
          >
            Proceed to Readiness Review
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
