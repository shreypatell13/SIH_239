"use client";

import React from "react";
import { ExtractedEvidenceFieldDTO } from "@/server/domain/officer/types";

interface BoundingBoxOverlayProps {
  fields: ExtractedEvidenceFieldDTO[];
  currentPage: number;
  selectedFieldId: string | null;
  onSelectField: (field: ExtractedEvidenceFieldDTO) => void;
}

export function BoundingBoxOverlay({
  fields,
  currentPage,
  selectedFieldId,
  onSelectField,
}: BoundingBoxOverlayProps) {
  // Filter fields on active page that have bounding box coordinates
  const pageFields = fields.filter((f) => f.pageNumber === currentPage && f.boundingBox !== null);

  if (pageFields.length === 0) {
    return null;
  }

  const getBoxStyle = (field: ExtractedEvidenceFieldDTO, isSelected: boolean) => {
    if (isSelected) {
      return {
        border: "2px solid #EAB308",
        backgroundColor: "rgba(234, 179, 8, 0.25)",
        zIndex: 30,
      };
    }

    if (field.extractedBy === "HUMAN_OVERRIDE") {
      return {
        border: "1.5px solid #8B5CF6",
        backgroundColor: "rgba(139, 92, 246, 0.15)",
        zIndex: 20,
      };
    }

    if (field.confidenceScore >= 0.8) {
      return {
        border: "1.5px solid #3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.15)",
        zIndex: 10,
      };
    } else if (field.confidenceScore >= 0.5) {
      return {
        border: "1.5px solid #F59E0B",
        backgroundColor: "rgba(245, 158, 11, 0.15)",
        zIndex: 10,
      };
    } else {
      return {
        border: "1.5px dashed #EF4444",
        backgroundColor: "rgba(239, 68, 68, 0.15)",
        zIndex: 10,
      };
    }
  };

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ width: "100%", height: "100%" }}
      data-testid="bounding-box-overlay-container"
    >
      {pageFields.map((field) => {
        const bbox = field.boundingBox!;
        const isSelected = field.id === selectedFieldId;
        const style = getBoxStyle(field, isSelected);

        // Normalized relative coordinates (0 to 1 -> 0% to 100%)
        const left = `${Math.max(0, Math.min(100, bbox.x <= 1 ? bbox.x * 100 : bbox.x))}%`;
        const top = `${Math.max(0, Math.min(100, bbox.y <= 1 ? bbox.y * 100 : bbox.y))}%`;
        const width = `${Math.max(2, Math.min(100, bbox.width <= 1 ? bbox.width * 100 : bbox.width))}%`;
        const height = `${Math.max(2, Math.min(100, bbox.height <= 1 ? bbox.height * 100 : bbox.height))}%`;

        return (
          <div
            key={field.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelectField(field);
            }}
            title={`${field.label}: ${field.rawValue} (Confidence: ${(field.confidenceScore * 100).toFixed(0)}%)`}
            className="group pointer-events-auto absolute cursor-pointer transition-all hover:opacity-100 hover:ring-2 hover:ring-blue-400 hover:ring-offset-1"
            style={{
              left,
              top,
              width,
              height,
              ...style,
            }}
            data-testid={`bbox-${field.fieldKey}`}
          >
            {/* Tooltip on hover */}
            <span className="absolute -top-5 left-0 z-50 hidden whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-medium text-white shadow-md group-hover:block">
              {field.label}: {field.rawValue}
            </span>
          </div>
        );
      })}
    </div>
  );
}
