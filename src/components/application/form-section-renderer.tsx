"use client";

import React from "react";
import { FormField, FormSection } from "@/server/domain/scheme/types";
import { FormFieldRenderer } from "./form-field-renderer";
import { isFieldVisible } from "@/server/domain/application/validators";

interface FormSectionRendererProps {
  section: FormSection;
  fields: FormField[];
  formData: Record<string, unknown>;
  errors: Record<string, string>;
  onChange: (fieldId: string, val: unknown) => void;
  disabled?: boolean;
}

export function FormSectionRenderer({
  section,
  fields,
  formData,
  errors,
  onChange,
  disabled = false,
}: FormSectionRendererProps) {
  // Filter fields belonging to this section and sort by order
  const sectionFields = fields
    .filter((f) => f.sectionId === section.id)
    .sort((a, b) => a.order - b.order);

  // Filter out fields that are currently conditionally hidden
  const visibleFields = sectionFields.filter((f) => isFieldVisible(f, formData));

  return (
    <div className="space-y-6" data-testid={`form-section-${section.id}`}>
      <div className="border-b border-slate-200 pb-3">
        <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
        {section.description && (
          <p className="mt-1 text-sm text-slate-500">{section.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {visibleFields.map((field) => (
          <div
            key={field.id}
            className={
              field.type === "textarea" || field.type === "multiselect"
                ? "md:col-span-2"
                : "col-span-1"
            }
          >
            <FormFieldRenderer
              field={field}
              value={formData[field.id]}
              error={errors[field.id]}
              onChange={onChange}
              disabled={disabled}
            />
          </div>
        ))}

        {visibleFields.length === 0 && (
          <div className="col-span-2 rounded-md bg-slate-50 p-4 text-center text-sm text-slate-500">
            No active fields in this section for the selected options.
          </div>
        )}
      </div>
    </div>
  );
}
