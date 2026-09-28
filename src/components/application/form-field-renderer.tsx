"use client";

import React from "react";
import { FormField } from "@/server/domain/scheme/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface FormFieldRendererProps {
  field: FormField;
  value: unknown;
  error?: string;
  onChange: (fieldId: string, val: unknown) => void;
  disabled?: boolean;
}

export function FormFieldRenderer({
  field,
  value,
  error,
  onChange,
  disabled = false,
}: FormFieldRendererProps) {
  const { id, label, type, placeholder, helpText, validation } = field;
  const isRequired = Boolean(validation?.required);

  const renderControl = () => {
    switch (type) {
      case "textarea":
        return (
          <Textarea
            id={id}
            placeholder={placeholder || `Enter ${label}`}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(id, e.target.value)}
            disabled={disabled}
            className={error ? "border-rose-500 focus-visible:ring-rose-500" : ""}
            rows={4}
          />
        );

      case "number":
        return (
          <Input
            id={id}
            type="number"
            placeholder={placeholder || "0"}
            min={validation?.min}
            max={validation?.max}
            value={value !== undefined && value !== null ? String(value) : ""}
            onChange={(e) => {
              const val = e.target.value === "" ? "" : Number(e.target.value);
              onChange(id, val);
            }}
            disabled={disabled}
            className={error ? "border-rose-500 focus-visible:ring-rose-500" : ""}
          />
        );

      case "date":
        return (
          <Input
            id={id}
            type="date"
            placeholder={placeholder}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(id, e.target.value)}
            disabled={disabled}
            className={error ? "border-rose-500 focus-visible:ring-rose-500" : ""}
          />
        );

      case "email":
        return (
          <Input
            id={id}
            type="email"
            placeholder={placeholder || "applicant@domain.com"}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(id, e.target.value)}
            disabled={disabled}
            className={error ? "border-rose-500 focus-visible:ring-rose-500" : ""}
          />
        );

      case "select":
        return (
          <select
            id={id}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(id, e.target.value)}
            disabled={disabled}
            className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              error ? "border-rose-500 focus:ring-rose-500" : "border-slate-300"
            }`}
          >
            <option value="">-- Select an option --</option>
            {validation?.allowedValues?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case "multiselect": {
        const selectedArr = Array.isArray(value) ? (value as string[]) : [];
        return (
          <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50/50 p-3">
            {validation?.allowedValues?.map((opt) => {
              const isChecked = selectedArr.includes(opt);
              return (
                <label
                  key={opt}
                  className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={disabled}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onChange(id, [...selectedArr, opt]);
                      } else {
                        onChange(
                          id,
                          selectedArr.filter((item) => item !== opt)
                        );
                      }
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-gov-navy focus:ring-gov-slate"
                  />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        );
      }

      case "boolean":
        return (
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name={id}
                checked={value === true || value === "true"}
                disabled={disabled}
                onChange={() => onChange(id, true)}
                className="h-4 w-4 text-gov-navy focus:ring-gov-slate"
              />
              <span>Yes</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name={id}
                checked={value === false || value === "false"}
                disabled={disabled}
                onChange={() => onChange(id, false)}
                className="h-4 w-4 text-gov-navy focus:ring-gov-slate"
              />
              <span>No</span>
            </label>
          </div>
        );

      case "text":
      default:
        return (
          <Input
            id={id}
            type="text"
            placeholder={placeholder || `Enter ${label}`}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(id, e.target.value)}
            disabled={disabled}
            className={error ? "border-rose-500 focus-visible:ring-rose-500" : ""}
          />
        );
    }
  };

  return (
    <div className="space-y-1.5" data-testid={`form-field-${id}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium text-slate-800">
          {label}
          {isRequired && <span className="ml-1 text-rose-500">*</span>}
        </Label>
      </div>

      {renderControl()}

      {helpText && <p className="text-xs text-slate-500">{helpText}</p>}
      {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}
