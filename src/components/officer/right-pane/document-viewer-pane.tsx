"use client";

import React, { useState } from "react";
import { OfficerDocumentItemDTO, ExtractedEvidenceFieldDTO } from "@/server/domain/officer/types";
import { DocumentCanvas } from "./document-canvas";
import { EvidenceProvenanceCard } from "./evidence-provenance-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileCheck,
  AlertTriangle,
  RotateCw,
} from "lucide-react";

interface DocumentViewerPaneProps {
  documents: OfficerDocumentItemDTO[];
  selectedDocumentId: string;
  onSelectDocument: (docId: string) => void;
  selectedField: ExtractedEvidenceFieldDTO | null;
  onSelectField: (field: ExtractedEvidenceFieldDTO | null) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function DocumentViewerPane({
  documents,
  selectedDocumentId,
  onSelectDocument,
  selectedField,
  onSelectField,
  currentPage,
  onPageChange,
}: DocumentViewerPaneProps) {
  const [zoom, setZoom] = useState(100);

  const currentDoc = documents.find((d) => d.id === selectedDocumentId) || documents[0];

  if (!currentDoc) {
    return (
      <Card className="border-slate-200 p-8 text-center text-xs text-slate-400 shadow-sm">
        No documents uploaded for this case dossier.
      </Card>
    );
  }

  const maxPages = currentDoc.pageCount || 1;

  const handleZoomIn = () => setZoom((z) => Math.min(150, z + 15));
  const handleZoomOut = () => setZoom((z) => Math.max(75, z - 15));
  const handleZoomReset = () => setZoom(100);

  return (
    <div className="space-y-3" data-testid="document-viewer-pane">
      {/* 1. Document Tabs Switcher */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 pb-1 text-xs">
        {documents.map((doc) => {
          const isSelected = doc.id === currentDoc.id;
          const isReviewRequired = doc.processingStatus === "REVIEW_REQUIRED";

          return (
            <button
              key={doc.id}
              type="button"
              onClick={() => {
                onSelectDocument(doc.id);
                onPageChange(1);
                onSelectField(null);
              }}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-t-md px-3 py-2 text-xs font-semibold transition-colors ${
                isSelected
                  ? "border-b-2 border-gov-slate bg-gov-slate text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              data-testid={`doc-tab-${doc.documentType}`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>{doc.documentType.replace(/_/g, " ")}</span>
              {isReviewRequired && (
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Viewer Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2.5 text-xs shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">{currentDoc.originalFilename}</span>
          <Badge
            variant={
              currentDoc.processingStatus === "COMPLETED"
                ? "success"
                : currentDoc.processingStatus === "REVIEW_REQUIRED"
                  ? "warning"
                  : "outline"
            }
            className="text-[10px]"
          >
            {currentDoc.processingStatus}
          </Badge>
          {currentDoc.classifiedAs && currentDoc.classifiedAs !== currentDoc.documentType && (
            <Badge variant="outline" className="bg-amber-50 text-[10px] text-amber-700">
              Classified as: {currentDoc.classifiedAs.replace(/_/g, " ")}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Page Selector */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className="h-7 w-7 p-0"
              title="Previous Page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-1 text-xs text-slate-600">
              Page {currentPage} of {maxPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage >= maxPages}
              onClick={() => onPageChange(Math.min(maxPages, currentPage + 1))}
              className="h-7 w-7 p-0"
              title="Next Page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomOut}
              disabled={zoom <= 75}
              className="h-7 w-7 p-0"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <button
              type="button"
              onClick={handleZoomReset}
              className="px-1 font-mono text-[11px] text-slate-600 hover:text-slate-900"
              title="Reset Zoom"
            >
              {zoom}%
            </button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomIn}
              disabled={zoom >= 150}
              className="h-7 w-7 p-0"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Document Canvas with Overlays */}
      <DocumentCanvas
        document={currentDoc}
        currentPage={currentPage}
        zoom={zoom}
        selectedFieldId={selectedField?.id || null}
        onSelectField={(f) => onSelectField(f)}
      />

      {/* 4. Active Field Provenance Card */}
      <EvidenceProvenanceCard field={selectedField} onClear={() => onSelectField(null)} />
    </div>
  );
}
