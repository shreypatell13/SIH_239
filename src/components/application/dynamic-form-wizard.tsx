"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { FormSchema } from "@/server/domain/scheme/types";
import { FormSectionRenderer } from "./form-section-renderer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Save, ArrowRight, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import {
  sanitizeHiddenFieldValues,
  validateApplicationFormData,
} from "@/server/domain/application/validators";

interface DynamicFormWizardProps {
  applicationId: string;
  formSchema: FormSchema;
  initialData?: Record<string, unknown>;
  onSaveSuccess?: (data: Record<string, unknown>) => void;
  onProceedToDocuments?: () => void;
  disabled?: boolean;
}

export function DynamicFormWizard({
  applicationId,
  formSchema,
  initialData = {},
  onSaveSuccess,
  onProceedToDocuments,
  disabled = false,
}: DynamicFormWizardProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving" | "error">("saved");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  const sections = formSchema.sections.sort((a, b) => a.order - b.order);
  const currentSection = sections[activeSectionIndex] || sections[0];

  // Perform actual API save
  const persistFormData = useCallback(
    async (dataToPersist: Record<string, unknown>) => {
      if (disabled) return;
      setSaveStatus("saving");
      setErrorMessage(null);

      try {
        const sanitized = sanitizeHiddenFieldValues(formSchema, dataToPersist);
        const res = await fetch(`/api/applicant/applications/${applicationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formData: sanitized }),
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error?.message || "Failed to save form data");
        }

        setSaveStatus("saved");
        setLastSavedAt(new Date());
        if (onSaveSuccess) {
          onSaveSuccess(sanitized);
        }
      } catch (err: unknown) {
        setSaveStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Error saving draft");
      }
    },
    [applicationId, disabled, formSchema, onSaveSuccess]
  );

  // Field change handler with debounced auto-save (2000ms)
  const handleFieldChange = (fieldId: string, value: unknown) => {
    if (disabled) return;

    const nextData = { ...formData, [fieldId]: value };
    setFormData(nextData);
    setSaveStatus("unsaved");

    // Clear error for this field
    if (errors[fieldId]) {
      const nextErrors = { ...errors };
      delete nextErrors[fieldId];
      setErrors(nextErrors);
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      persistFormData(nextData);
    }, 2000);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Update initial data if prop changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
  }, [initialData]);

  // Section completion check
  const isSectionComplete = (sectionId: string): boolean => {
    const sectionFields = formSchema.fields.filter((f) => f.sectionId === sectionId);
    const validation = validateApplicationFormData(
      { ...formSchema, fields: sectionFields },
      formData
    );
    return validation.isValid;
  };

  const handleNext = async () => {
    // Validate current section before moving
    const sectionFields = formSchema.fields.filter((f) => f.sectionId === currentSection.id);
    const validation = validateApplicationFormData(
      { ...formSchema, fields: sectionFields },
      formData
    );

    if (!validation.isValid) {
      const fieldErrors: Record<string, string> = {};
      for (const err of validation.errors) {
        fieldErrors[err.fieldId] = err.message;
      }
      setErrors(fieldErrors);
      setErrorMessage("Please complete the required fields in this section.");
      return;
    }

    // Save immediately before changing step
    await persistFormData(formData);

    if (activeSectionIndex < sections.length - 1) {
      setActiveSectionIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (onProceedToDocuments) {
      onProceedToDocuments();
    }
  };

  const handlePrev = async () => {
    if (activeSectionIndex > 0) {
      await persistFormData(formData);
      setActiveSectionIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Save Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Application Form</h2>
          <p className="text-xs text-slate-500">
            Step {activeSectionIndex + 1} of {sections.length}: {currentSection.title}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1 font-medium text-amber-600">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving draft...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 font-medium text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Draft saved{" "}
                {lastSavedAt
                  ? `at ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : ""}
              </span>
            )}
            {saveStatus === "unsaved" && (
              <span className="italic text-slate-500">Unsaved changes...</span>
            )}
            {saveStatus === "error" && (
              <span className="font-medium text-rose-600">Save failed</span>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => persistFormData(formData)}
            disabled={disabled || saveStatus === "saving"}
            className="flex items-center gap-1 text-xs"
          >
            <Save className="h-3.5 w-3.5" />
            Save Progress
          </Button>
        </div>
      </div>

      {/* Section Progress Tabs */}
      <div className="scrollbar-none flex gap-2 overflow-x-auto border-b border-slate-200 pb-1">
        {sections.map((sec, idx) => {
          const isActive = idx === activeSectionIndex;
          const complete = isSectionComplete(sec.id);

          return (
            <button
              key={sec.id}
              onClick={() => {
                persistFormData(formData);
                setActiveSectionIndex(idx);
              }}
              className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-gov-navy bg-gov-navy/5 font-semibold text-gov-navy"
                  : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  isActive
                    ? "bg-gov-navy text-white"
                    : complete
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-600"
                }`}
              >
                {complete && !isActive ? "✓" : idx + 1}
              </span>
              <span>{sec.title}</span>
            </button>
          );
        })}
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Active Section Fields Form */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <FormSectionRenderer
          section={currentSection}
          fields={formSchema.fields}
          formData={formData}
          errors={errors}
          onChange={handleFieldChange}
          disabled={disabled}
        />
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between border-t border-slate-200 pt-4">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={activeSectionIndex === 0 || disabled}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous Section
        </Button>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleNext}
            disabled={disabled}
            className="flex items-center gap-2 bg-gov-navy text-white hover:bg-gov-navy/90"
          >
            {activeSectionIndex === sections.length - 1 ? (
              <>
                Proceed to Document Checklist
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Save & Next Section
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
