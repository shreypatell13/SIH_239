"use client";

import React from "react";
import { OfficerDocumentItemDTO, ExtractedEvidenceFieldDTO } from "@/server/domain/officer/types";
import { BoundingBoxOverlay } from "./bounding-box-overlay";
import { FileText, Image as ImageIcon } from "lucide-react";

interface DocumentCanvasProps {
  document: OfficerDocumentItemDTO;
  currentPage: number;
  zoom: number;
  selectedFieldId: string | null;
  onSelectField: (field: ExtractedEvidenceFieldDTO) => void;
}

export function DocumentCanvas({
  document,
  currentPage,
  zoom,
  selectedFieldId,
  onSelectField,
}: DocumentCanvasProps) {
  const isPdf =
    document.mimeType === "application/pdf" || document.storagePath.toLowerCase().endsWith(".pdf");
  const previewUrl = `/api/documents/preview/${document.storagePath}#page=${currentPage}`;

  return (
    <div
      className="relative flex min-h-[500px] items-center justify-center overflow-auto rounded-lg border border-slate-200 bg-slate-100 p-4"
      data-testid="document-canvas-container"
    >
      <div
        className="relative origin-top bg-white shadow-md transition-transform"
        style={{
          transform: `scale(${zoom / 100})`,
          width: isPdf ? "100%" : "auto",
          maxWidth: "800px",
          minHeight: "600px",
        }}
      >
        {isPdf ? (
          <div className="relative h-[650px] w-full">
            <iframe
              src={previewUrl}
              title={document.originalFilename}
              className="h-full w-full rounded border-0"
              data-testid="pdf-preview-iframe"
            />
            {/* Overlay */}
            <BoundingBoxOverlay
              fields={document.extractedFields}
              currentPage={currentPage}
              selectedFieldId={selectedFieldId}
              onSelectField={onSelectField}
            />
          </div>
        ) : (
          <div className="relative inline-block max-w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/documents/preview/${document.storagePath}`}
              alt={document.originalFilename}
              className="block h-auto max-w-full rounded"
              data-testid="image-preview"
            />
            {/* Overlay */}
            <BoundingBoxOverlay
              fields={document.extractedFields}
              currentPage={currentPage}
              selectedFieldId={selectedFieldId}
              onSelectField={onSelectField}
            />
          </div>
        )}
      </div>
    </div>
  );
}
