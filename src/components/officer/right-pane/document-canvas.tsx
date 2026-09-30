"use client";

import React, { useState } from "react";
import { OfficerDocumentItemDTO, ExtractedEvidenceFieldDTO } from "@/server/domain/officer/types";
import { BoundingBoxOverlay } from "./bounding-box-overlay";

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
  const [imageError, setImageError] = useState(false);

  // Render high-resolution image preview for pixel-perfect bounding box alignment without iframe toolbars or nested scrollbars
  const previewImageUrl = `/api/documents/preview/${document.storagePath}?format=image`;
  const pdfFallbackUrl = `/api/documents/preview/${document.storagePath}#page=${currentPage}`;

  return (
    <div
      className="relative flex min-h-[520px] max-h-[720px] items-start justify-center overflow-auto rounded-lg border border-slate-200 bg-slate-100/90 p-3 shadow-inner"
      data-testid="document-canvas-container"
    >
      <div
        className="relative origin-top bg-white shadow-md transition-transform duration-150 rounded border border-slate-300"
        style={{
          transform: `scale(${zoom / 100})`,
          width: "100%",
          maxWidth: "760px",
        }}
      >
        {!imageError ? (
          <div className="relative w-full aspect-[595/842] overflow-hidden rounded bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImageUrl}
              alt={document.originalFilename}
              onError={() => setImageError(true)}
              className="block w-full h-full object-contain select-none pointer-events-none"
              data-testid="document-canvas-image"
            />
            {/* Bounding Box Overlay anchored with mathematical exactness to the document page */}
            <BoundingBoxOverlay
              fields={document.extractedFields}
              currentPage={currentPage}
              selectedFieldId={selectedFieldId}
              onSelectField={onSelectField}
            />
          </div>
        ) : (
          <div className="relative h-[650px] w-full">
            <iframe
              src={pdfFallbackUrl}
              title={document.originalFilename}
              className="h-full w-full rounded border-0"
              data-testid="pdf-preview-iframe"
            />
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
