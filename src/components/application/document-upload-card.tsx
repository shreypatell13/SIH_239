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

    // 1. Client-side MIME check
    if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(file.type)) {
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

      {/* Uploaded File Info Card */}
      {isUploaded && uploadedDocument && (
        <div className="mt-3 flex items-center justify-between rounded-md border border-emerald-100 bg-white p-3 text-xs">
          <div className="flex items-center gap-2.5">
            <FileCheck className="h-4 w-4 text-emerald-600" />
            <div>
              <span className="font-medium text-slate-800">
                {uploadedDocument.originalFilename}
              </span>
              <span className="ml-2 text-slate-500">
                ({(uploadedDocument.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB)
              </span>
            </div>
          </div>
          {uploadedDocument.processingStatus === "PENDING" && (
            <Badge
              variant="outline"
              className="border-amber-200 bg-amber-50 text-[10px] text-amber-700"
            >
              Your document is queued for processing.
            </Badge>
          )}
          {uploadedDocument.processingStatus === "PROCESSING" && (
            <Badge
              variant="outline"
              className="border-blue-200 bg-blue-50 text-[10px] text-blue-700"
            >
              Your document is being analysed.
            </Badge>
          )}
          {uploadedDocument.processingStatus === "COMPLETED" && (
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700"
            >
              Document processing completed.
            </Badge>
          )}
          {uploadedDocument.processingStatus === "REVIEW_REQUIRED" && (
            <Badge
              variant="outline"
              className="border-amber-200 bg-amber-50 text-[10px] text-amber-700"
            >
              Our team is reviewing this document. No action is needed yet.
            </Badge>
          )}
          {uploadedDocument.processingStatus === "FAILED" && (
            <Badge
              variant="outline"
              className="border-rose-200 bg-rose-50 text-[10px] text-rose-700"
            >
              {"We couldn't process this document. Please upload a clearer copy."}
            </Badge>
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
