"use client";

import React from "react";
import { ExtractedEvidenceFieldDTO } from "@/server/domain/officer/types";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Eye, ShieldCheck, AlertTriangle, X } from "lucide-react";

interface EvidenceProvenanceCardProps {
  field: ExtractedEvidenceFieldDTO | null;
  onClear?: () => void;
}

export function EvidenceProvenanceCard({ field, onClear }: EvidenceProvenanceCardProps) {
  if (!field) {
    return (
      <div className="rounded border border-dashed border-slate-200 bg-slate-50/50 p-2.5 text-center text-[11px] text-slate-400">
        Click any extracted evidence field or highlighted bounding box to inspect OCR provenance.
      </div>
    );
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return (
        <Badge variant="success" className="text-[10px]">
          High ({(confidence * 100).toFixed(0)}%)
        </Badge>
      );
    } else if (confidence >= 0.5) {
      return (
        <Badge variant="warning" className="text-[10px]">
          Medium ({(confidence * 100).toFixed(0)}%)
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="text-[10px]">
          Low / Degraded ({(confidence * 100).toFixed(0)}%)
        </Badge>
      );
    }
  };

  return (
    <div
      className="relative space-y-2 rounded-lg border border-blue-200 bg-blue-50/40 p-3 text-xs transition-all"
      data-testid="evidence-provenance-card"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          <span className="font-bold text-slate-900">{field.label}</span>
          <Badge variant="outline" className="bg-white text-[10px]">
            Page {field.pageNumber}
          </Badge>
          {getConfidenceBadge(field.confidenceScore)}
        </div>

        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="rounded p-0.5 text-slate-400 hover:bg-blue-100 hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Values */}
      <div className="grid grid-cols-2 gap-2 rounded border border-blue-100 bg-white p-2 text-[11px]">
        <div>
          <span className="block text-slate-400">Raw Extracted Value:</span>
          <span className="break-words font-mono font-medium text-slate-800">{field.rawValue}</span>
        </div>
        <div>
          <span className="block text-slate-400">Normalized Value:</span>
          <span className="break-words font-medium text-slate-800">
            {field.normalizedValue || field.rawValue}
          </span>
        </div>
      </div>

      {/* Source snippet */}
      {field.sourceSnippet && (
        <div className="rounded border border-slate-100 bg-white/80 p-1.5 text-[10px] text-slate-600">
          <span className="block font-semibold text-slate-400">OCR Context Snippet:</span>
          <span className="font-mono italic text-slate-700">
            &ldquo;{field.sourceSnippet}&rdquo;
          </span>
        </div>
      )}

      {/* Provenance Metadata */}
      <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-slate-500">
        <span>
          Method: <strong className="text-slate-700">{field.extractionMethod || "REGEX"}</strong>
        </span>
        <span>
          Provider:{" "}
          <strong className="text-slate-700">{field.extractorProvider || "tesseract-ocr"}</strong>
        </span>
        <span>
          Extracted By: <strong className="text-slate-700">{field.extractedBy}</strong>
        </span>
        {field.boundingBox && (
          <span className="font-mono text-[9px] text-slate-400">
            BBox: [{field.boundingBox.x.toFixed(3)}, {field.boundingBox.y.toFixed(3)}, {field.boundingBox.width.toFixed(3)}, {field.boundingBox.height.toFixed(3)}]
          </span>
        )}
      </div>
    </div>
  );
}
