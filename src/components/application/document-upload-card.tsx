"use client";

import React, { useState, useRef } from "react";
import { ChecklistItemDTO } from "@/server/domain/application/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Upload,
  CheckCircle2,
  Trash2,
  Eye,
  AlertCircle,
  AlertTriangle,
  Info,
  Sparkles,
  Loader2,
  FileCheck,
} from "lucide-react";

interface DocumentUploadCardProps {
  applicationId: string;
  item: ChecklistItemDTO;
  onUploadSuccess: () => void;
  disabled?: boolean;
}

export function DocumentUploadCard({
  applicationId,
  item,
  onUploadSuccess,
  disabled = false,
}: DocumentUploadCardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    documentType,
    label,
    description,
    level,
    isRequired,
    isUploaded,
    uploadedDocument,
    allowedMimeTypes,
    maxFileSizeMb,
    validityWindowMonths,
    issuerCriteria,
  } = item;

  const handleFileSelect = async (file: File) => {
    if (disabled || isUploading) return;
    setErrorMsg(null);

    // 1. Client-side MIME check (fallback to filename extension if browser MIME is unset)
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    const extMimeMap: Record<string, string> = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
    };
    const resolvedMime = file.type || (fileExt ? extMimeMap[fileExt] : "");
    if (allowedMimeTypes.length > 0 && resolvedMime && !allowedMimeTypes.includes(resolvedMime)) {
      setErrorMsg(`Invalid file type. Allowed: ${allowedMimeTypes.join(", ")}`);
      return;
    }

    // 2. Client-side Size check
    const maxBytes = maxFileSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMsg(`File exceeds ${maxFileSizeMb} MB limit.`);
      return;
    }

    // 3. Upload multipart
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      const res = await fetch(`/api/applicant/applications/${applicationId}/documents`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to upload file");
      }

      onUploadSuccess();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Upload error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async () => {
    if (!uploadedDocument || disabled || isDeleting) return;
    setIsDeleting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(
        `/api/applicant/applications/${applicationId}/documents/${uploadedDocument.id}`,
        {
          method: "DELETE",
        }
      );

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to delete file");
      }

      onUploadSuccess();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Delete error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={`rounded-lg border p-5 transition-all ${
        isUploaded
          ? "shadow-xs border-emerald-200 bg-emerald-50/20"
          : isRequired
            ? "shadow-xs border-amber-200 bg-amber-50/10"
            : "border-slate-200 bg-white"
      }`}
      data-testid={`document-card-${documentType}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900">{label}</span>
            {isRequired ? (
              <Badge
                variant="destructive"
                className="text-[10px] font-bold uppercase tracking-wider"
              >
                Mandatory
              </Badge>
            ) : level === "CONDITIONAL" ? (
              <Badge variant="warning" className="text-[10px] font-bold uppercase tracking-wider">
                Conditional
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
                Optional
              </Badge>
            )}

            {isUploaded && (
              <Badge variant="success" className="flex items-center gap-1 text-[10px]">
                <CheckCircle2 className="h-3 w-3" />
                Uploaded (v{uploadedDocument?.version || 1})
              </Badge>
            )}
          </div>

          <p className="text-xs text-slate-600">{description}</p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[11px] text-slate-500">
            <span>
              <strong>Formats:</strong>{" "}
              {allowedMimeTypes.map((m) => m.split("/")[1].toUpperCase()).join(", ")}
            </span>
            <span>
              <strong>Max Size:</strong> {maxFileSizeMb} MB
            </span>
            {validityWindowMonths && (
              <span>
                <strong>Validity:</strong> Last {validityWindowMonths} months
              </span>
            )}
            {issuerCriteria && (
              <span className="text-gov-slate">
                <strong>Issuing Authority:</strong> {issuerCriteria}
              </span>
            )}
          </div>
        </div>

        {/* Action / Upload Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
          <input
            ref={fileInputRef}
            type="file"
            accept={allowedMimeTypes.join(",")}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />

          {isUploaded && uploadedDocument ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-xs"
                onClick={() => window.open(uploadedDocument.previewUrl, "_blank")}
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={disabled || isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-xs"
              >
                <Upload className="h-3.5 w-3.5" />
                Replace
              </Button>

              <Button
                variant="destructive"
                size="sm"
                disabled={disabled || isDeleting}
                onClick={handleDelete}
                className="flex items-center gap-1 text-xs"
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Remove
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={disabled || isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 border-gov-navy text-xs font-semibold text-gov-navy hover:bg-gov-navy/5"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Upload Document
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Uploaded File Info Card & AI Intelligence Status */}
      {isUploaded && uploadedDocument && (
        <div className="mt-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-white p-3 text-xs shadow-2xs">
            <div className="flex items-center gap-2.5">
              <FileCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="font-semibold text-slate-800">
                  {uploadedDocument.originalFilename}
                </span>
                <span className="ml-2 text-slate-500 font-mono text-[11px]">
                  ({(uploadedDocument.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>
            </div>

            {uploadedDocument.processingStatus === "PENDING" && (
              <Badge
                variant="outline"
                className="flex items-center gap-1.5 border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800"
              >
                <Loader2 className="h-3 w-3 animate-spin text-amber-600" />
                Document queued for AI intelligence (~35s)...
              </Badge>
            )}
            {uploadedDocument.processingStatus === "PROCESSING" && (
              <Badge
                variant="outline"
                className="flex items-center gap-1.5 border-blue-300 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-800"
              >
                <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                Analyzing OCR, Classification & Extracting Intelligence...
              </Badge>
            )}
            {uploadedDocument.processingStatus === "COMPLETED" && !uploadedDocument.aiAudit?.hasIssues && (
              <Badge
                variant="outline"
                className="flex items-center gap-1.5 border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Document Intelligence Verified
              </Badge>
            )}
            {uploadedDocument.aiAudit?.mismatchDetected && (
              <Badge
                variant="destructive"
                className="flex items-center gap-1.5 bg-rose-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Document Type Mismatch Detected
              </Badge>
            )}
            {!uploadedDocument.aiAudit?.mismatchDetected &&
              uploadedDocument.aiAudit?.qualityWarning?.isBlurryOrLowQuality && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1.5 border-amber-400 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800"
                >
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                  Quality Warning / Potential Blur
                </Badge>
              )}
            {!uploadedDocument.aiAudit?.mismatchDetected &&
              !uploadedDocument.aiAudit?.qualityWarning &&
              uploadedDocument.aiAudit?.infoMismatches &&
              uploadedDocument.aiAudit.infoMismatches.length > 0 && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1.5 border-indigo-300 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-800"
                >
                  <Info className="h-3.5 w-3.5 text-indigo-600" />
                  Information Mismatch
                </Badge>
              )}
            {uploadedDocument.processingStatus === "REVIEW_REQUIRED" &&
              !uploadedDocument.aiAudit?.mismatchDetected &&
              !uploadedDocument.aiAudit?.qualityWarning &&
              (!uploadedDocument.aiAudit?.infoMismatches ||
                uploadedDocument.aiAudit.infoMismatches.length === 0) && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1.5 border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800"
                >
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                  Review required by verification officer
                </Badge>
              )}
            {uploadedDocument.processingStatus === "FAILED" && (
              <Badge
                variant="outline"
                className="flex items-center gap-1.5 border-rose-300 bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-800"
              >
                <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                Processing failed: Please upload a clearer copy.
              </Badge>
            )}
          </div>

          {/* 1. DOCUMENT MISMATCH ALERT BANNER */}
          {uploadedDocument.aiAudit?.mismatchDetected && (
            <div className="rounded-lg border border-rose-300 bg-rose-50/90 p-3.5 text-xs text-rose-950 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-start gap-2.5">
                <div className="rounded-full bg-rose-100 p-1.5 text-rose-600 flex-shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-bold text-rose-900 text-sm">
                      ⚠️ AI Document Type Mismatch Detected
                    </span>
                    {uploadedDocument.aiAudit.mismatchDetails?.confidence && (
                      <span className="rounded bg-rose-200/80 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                        Match Confidence: {uploadedDocument.aiAudit.mismatchDetails.confidence}%
                      </span>
                    )}
                  </div>
                  <p className="text-rose-800 leading-relaxed font-medium">
                    {uploadedDocument.aiAudit.mismatchDetails?.message}
                  </p>
                  <p className="pt-1 text-[11px] font-semibold text-rose-700">
                    👉 <strong>Action Required:</strong> {uploadedDocument.aiAudit.actionableGuidance || "Please replace this file with the correct document."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. BLUR / LOW QUALITY WARNING BANNER */}
          {uploadedDocument.aiAudit?.qualityWarning?.isBlurryOrLowQuality && (
            <div className="rounded-lg border border-amber-300 bg-amber-50/90 p-3.5 text-xs text-amber-950 shadow-sm">
              <div className="flex items-start gap-2.5">
                <div className="rounded-full bg-amber-100 p-1.5 text-amber-600 flex-shrink-0">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-bold text-amber-900 text-sm">
                      ⚠️ Low OCR Clarity / Potential Blur Warning
                    </span>
                    <span className="rounded bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      Clarity Score: {uploadedDocument.aiAudit.qualityWarning.confidence}%
                    </span>
                  </div>
                  <p className="text-amber-800 leading-relaxed">
                    {uploadedDocument.aiAudit.qualityWarning.message}
                  </p>
                  <p className="pt-1 text-[11px] text-amber-700 font-medium">
                    💡 <strong>Tip:</strong> Ensure your document scan is uncropped, well-lit, and all stamps/signatures are clearly legible to avoid verification queries.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. INFO MISMATCH ALERT BANNER */}
          {uploadedDocument.aiAudit?.infoMismatches &&
            uploadedDocument.aiAudit.infoMismatches.length > 0 && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/90 p-3.5 text-xs text-indigo-950 shadow-sm">
                <div className="flex items-start gap-2.5">
                  <div className="rounded-full bg-indigo-100 p-1.5 text-indigo-600 flex-shrink-0">
                    <Info className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <span className="font-bold text-indigo-900 text-sm">
                      ℹ️ Extracted Information Discrepancy Detected
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-indigo-800">
                      {uploadedDocument.aiAudit.infoMismatches.map((m, idx) => (
                        <li key={idx} className="leading-snug">
                          <strong>{m.fieldLabel}:</strong> {m.message}
                        </li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-indigo-700 font-medium">
                      💡 <strong>Note:</strong> Some information in your application does not match the uploaded document. Please review the highlighted field and submit the correct document/information.
                    </p>
                  </div>
                </div>
              </div>
            )}

          {/* 4. VERIFIED SUCCESS BANNER */}
          {uploadedDocument.aiAudit?.overallVerdict === "VERIFIED" && (
            <div className="flex items-center gap-2 rounded-md border border-emerald-200/70 bg-emerald-50/80 px-3 py-2 text-xs font-medium text-emerald-800">
              <Sparkles className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>
                <strong>AI Check Passed:</strong> Document classification, text clarity, and applicant details matched successfully.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error Message Alert */}
      {errorMsg && (
        <div className="mt-3 flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
