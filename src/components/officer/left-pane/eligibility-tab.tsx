"use client";

import React, { useState } from "react";
import { OfficerCaseDetailDTO } from "@/server/domain/officer/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  Sparkles,
  Layers,
  FileText,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";

interface EligibilityTabProps {
  data: OfficerCaseDetailDTO;
  onSelectEvidence?: (fieldId: string, documentId?: string, pageNumber?: number) => void;
  onReevaluated?: () => void;
}

export function EligibilityTab({ data, onSelectEvidence, onReevaluated }: EligibilityTabProps) {
  const [evaluating, setEvaluating] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);

  const { eligibility, application, scheme } = data;

  const handleReevaluate = async () => {
    setEvaluating(true);
    setEvalError(null);
    try {
      const res = await fetch(`/api/officer/applications/${application.id}/evaluate`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Evaluation failed.");
      }
      if (onReevaluated) onReevaluated();
    } catch (err) {
      setEvalError((err as Error).message);
    } finally {
      setEvaluating(false);
    }
  };

  const getAssessmentBanner = () => {
    switch (eligibility.assessmentStatus) {
      case "ELIGIBLE_ASSESSED":
        return (
          <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/80 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <div>
                <h4 className="text-xs font-bold text-emerald-900">
                  System Assessment: Eligible Assessed
                </h4>
                <p className="text-[11px] text-emerald-700">
                  All {eligibility.passedRulesCount} deterministic eligibility rules satisfied.
                </p>
              </div>
            </div>
            <Badge variant="success" className="text-xs">
              Eligible
            </Badge>
          </div>
        );
      case "NOT_ELIGIBLE_ASSESSED":
        return (
          <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50/80 p-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-600" />
              <div>
                <h4 className="text-xs font-bold text-rose-900">System Assessment: Not Eligible</h4>
                <p className="text-[11px] text-rose-700">
                  {eligibility.failedRulesCount} rule criteria not met by applicant evidence.
                </p>
              </div>
            </div>
            <Badge variant="destructive" className="text-xs">
              Criteria Not Met
            </Badge>
          </div>
        );
      case "REVIEW_REQUIRED":
      default:
        return (
          <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/80 p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">
                  System Assessment: Manual Review Required
                </h4>
                <p className="text-[11px] text-amber-700">
                  {eligibility.ambiguousRulesCount > 0
                    ? `${eligibility.ambiguousRulesCount} rule(s) have low OCR confidence or degraded documents.`
                    : "Evidence requires verification officer inspection."}
                </p>
              </div>
            </div>
            <Badge variant="warning" className="text-xs">
              Review Required
            </Badge>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4" data-testid="eligibility-tab">
      {/* 1. Assessment Status Banner */}
      {getAssessmentBanner()}

      {/* 2. Rule Evaluation Control Bar */}
      <div className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-600">
        <div>
          Pinned Specification:{" "}
          <strong className="font-semibold text-slate-900">
            {scheme.code} Version {scheme.versionNumber}
          </strong>
          <span className="ml-2 text-[11px] text-slate-400">
            ({eligibility.passedRulesCount} Pass &bull; {eligibility.failedRulesCount} Fail &bull;{" "}
            {eligibility.ambiguousRulesCount} Ambiguous)
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleReevaluate}
          disabled={evaluating}
          className="gap-1 text-xs"
        >
          {evaluating ? (
            <RotateCw className="h-3 w-3 animate-spin" />
          ) : (
            <RotateCw className="h-3 w-3" />
          )}
          Re-evaluate
        </Button>
      </div>

      {evalError && (
        <div className="rounded border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
          {evalError}
        </div>
      )}

      {/* 3. Deterministic Rules Table */}
      <Card className="border-slate-200 shadow-none">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-gov-slate" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Deterministic Rule Evaluations
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 text-xs">
            {eligibility.rules.length === 0 ? (
              <p className="p-4 text-center italic text-slate-400">
                No evaluation runs recorded. Click &quot;Re-evaluate&quot; to execute deterministic
                rule suite.
              </p>
            ) : (
              eligibility.rules.map((rule, idx) => (
                <div key={idx} className="space-y-2 p-3 transition-colors hover:bg-slate-50/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{rule.ruleName}</span>
                        {rule.appliedRelaxation && (
                          <Badge
                            variant="outline"
                            className="border-amber-200 bg-amber-50 text-[10px] text-amber-700"
                          >
                            ST Relaxation Applied
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">{rule.ruleDescription}</p>
                    </div>

                    <Badge
                      variant={
                        rule.outcome === "PASS"
                          ? "success"
                          : rule.outcome === "FAIL"
                            ? "destructive"
                            : "warning"
                      }
                      className="text-[10px]"
                    >
                      {rule.outcome}
                    </Badge>
                  </div>

                  {/* Values & Explanation */}
                  <div className="space-y-1 rounded border border-slate-100 bg-slate-50 p-2 text-[11px]">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>
                        Computed: <strong>{String(rule.computedValue || "N/A")}</strong>
                      </span>
                      <span>
                        Expected:{" "}
                        <strong>{String(rule.expectedValue || "Configured Threshold")}</strong>
                      </span>
                    </div>
                    {rule.failureReason && (
                      <p className="font-medium text-rose-700">{rule.failureReason}</p>
                    )}
                    {rule.outcome === "PASS" && (
                      <p className="font-medium text-emerald-700">
                        Scheme threshold verified deterministically.
                      </p>
                    )}
                  </div>

                  {/* Evidence Provenance Links */}
                  {rule.evidenceFieldIds && rule.evidenceFieldIds.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                      <span>Evidence:</span>
                      {rule.evidenceFieldIds.map((fId) => (
                        <button
                          key={fId}
                          type="button"
                          onClick={() => {
                            if (onSelectEvidence) onSelectEvidence(fId);
                          }}
                          className="inline-flex items-center gap-0.5 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                        >
                          Inspect Evidence
                          <ArrowUpRight className="h-2.5 w-2.5" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 4. Cross-Document Consistency Matrix / Information Mismatch */}
      {eligibility.consistencyChecks.length > 0 && (
        <Card className="border-slate-200 shadow-none">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-gov-slate" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Cross-Document Consistency &amp; Evidence Verification
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100">
            {eligibility.consistencyChecks.map((check, idx) => {
              const docLabel =
                check.documentType === "INCOME_CERTIFICATE"
                  ? "Income Certificate"
                  : check.documentType === "CASTE_CERTIFICATE"
                    ? "Scheduled Tribe Certificate"
                    : check.documentType === "DEGREE_TRANSCRIPT"
                      ? "Degree Transcript"
                      : check.documentType === "ADMISSION_OFFER_LETTER"
                        ? "Admission Offer Letter"
                        : check.documentType;

              return (
                <div
                  key={idx}
                  className={`p-3 space-y-2 ${
                    !check.isConsistent ? "bg-amber-50/40 border-l-4 border-l-amber-500" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">
                          {check.fieldLabel || check.fieldKey}
                        </span>
                        {!check.isConsistent && (
                          <Badge variant="warning" className="text-[10px] font-semibold">
                            INFORMATION MISMATCH
                          </Badge>
                        )}
                        {check.isConsistent && (
                          <Badge variant="success" className="text-[10px]">
                            CONSISTENT
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Source Document: <strong>{docLabel}</strong> &bull; OCR Confidence:{" "}
                        <strong>{Math.round((check.extractedConfidence || 0.95) * 100)}%</strong>
                      </p>
                    </div>

                    {check.evidenceFieldId && onSelectEvidence && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onSelectEvidence(check.evidenceFieldId!, check.documentId)
                        }
                        className="h-7 text-xs gap-1 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                      >
                        Inspect Evidence
                        <ArrowUpRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {/* Comparison Details Grid */}
                  <div className="rounded border border-slate-200/80 bg-white p-2.5 text-xs grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-400">
                        Application Form Value
                      </span>
                      <span className="font-semibold text-slate-900">{check.formValue}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-400">
                        Document Extracted Value
                      </span>
                      <span
                        className={`font-semibold ${
                          !check.isConsistent ? "text-amber-900 font-bold" : "text-slate-900"
                        }`}
                      >
                        {check.extractedValue}
                      </span>
                    </div>

                    {check.difference && (
                      <div className="col-span-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Difference / Discrepancy:</span>
                        <span className="font-bold text-amber-700">{check.difference}</span>
                      </div>
                    )}
                  </div>

                  {check.mismatchExplanation && (
                    <div className="text-[11px] text-amber-800 font-medium flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                      <span>{check.mismatchExplanation}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
