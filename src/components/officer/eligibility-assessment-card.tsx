"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  Info,
  Layers,
  Sparkles,
  FileText,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ApplicationEvaluationResult,
  RuleEvaluationResult,
} from "@/server/domain/eligibility/types";

interface EligibilityAssessmentCardProps {
  applicationId: string;
  initialResult?: ApplicationEvaluationResult | null;
  onEvaluated?: (result: ApplicationEvaluationResult) => void;
  canReevaluate?: boolean;
}

export function EligibilityAssessmentCard({
  applicationId,
  initialResult,
  onEvaluated,
  canReevaluate = true,
}: EligibilityAssessmentCardProps) {
  const [result, setResult] = useState<ApplicationEvaluationResult | null>(initialResult || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEvaluate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/officer/applications/${applicationId}/evaluate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to evaluate application eligibility.");
      }
      setResult(data.data);
      if (onEvaluated) {
        onEvaluated(data.data);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ELIGIBLE_ASSESSED":
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Eligible (System Assessed)
          </Badge>
        );
      case "NOT_ELIGIBLE_ASSESSED":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3.5 w-3.5" />
            Ineligible (Rule Criteria Not Met)
          </Badge>
        );
      case "REVIEW_REQUIRED":
      default:
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            Manual Review Required
          </Badge>
        );
    }
  };

  const getOutcomeBadge = (outcome: RuleEvaluationResult["outcome"]) => {
    switch (outcome) {
      case "PASS":
        return (
          <Badge variant="success" className="text-xs">
            PASS
          </Badge>
        );
      case "FAIL":
        return (
          <Badge variant="destructive" className="text-xs">
            FAIL
          </Badge>
        );
      case "AMBIGUOUS":
        return (
          <Badge variant="warning" className="text-xs">
            AMBIGUOUS
          </Badge>
        );
      case "SKIPPED":
      default:
        return (
          <Badge variant="outline" className="text-xs">
            SKIPPED
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-gov-slate" />
                <CardTitle className="text-lg font-bold text-slate-900">
                  Deterministic Eligibility &amp; Evidence Engine
                </CardTitle>
                {result && getStatusBadge(result.assessmentStatus)}
              </div>
              <CardDescription className="text-xs text-slate-500">
                Purely rule-based evaluation against pinned Scheme Version ruleset. No generative AI
                or probabilistic execution.
              </CardDescription>
            </div>

            {canReevaluate && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEvaluate}
                disabled={loading}
                className="flex items-center gap-1.5 self-start md:self-auto"
              >
                <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Evaluating Rules..." : "Re-evaluate Rules"}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-5">
          {error && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <XCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!result ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 py-10 text-center">
              <Layers className="mb-2 h-8 w-8 text-slate-400" />
              <p className="text-sm font-medium text-slate-700">No Evaluation Run Yet</p>
              <p className="max-w-md text-xs text-slate-500">
                Click &quot;Re-evaluate Rules&quot; to execute deterministic rule evaluation on
                submitted application form data and extracted document evidence.
              </p>
              {canReevaluate && (
                <Button
                  size="sm"
                  onClick={handleEvaluate}
                  disabled={loading}
                  className="mt-4 bg-gov-slate text-white hover:bg-slate-800"
                >
                  Run Eligibility Evaluation
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
                <div className="rounded-md border border-slate-200 bg-white p-3 text-center">
                  <span className="text-xs text-slate-500">Total Rules</span>
                  <p className="text-lg font-bold text-slate-800">{result.summary.totalRules}</p>
                </div>
                <div className="rounded-md border border-emerald-200 bg-emerald-50/50 p-3 text-center">
                  <span className="text-xs text-emerald-700">Passed</span>
                  <p className="text-lg font-bold text-emerald-800">{result.summary.passed}</p>
                </div>
                <div className="rounded-md border border-red-200 bg-red-50/50 p-3 text-center">
                  <span className="text-xs text-red-700">Hard Fails</span>
                  <p className="text-lg font-bold text-red-800">{result.summary.hardFails}</p>
                </div>
                <div className="rounded-md border border-amber-200 bg-amber-50/50 p-3 text-center">
                  <span className="text-xs text-amber-700">Ambiguous</span>
                  <p className="text-lg font-bold text-amber-800">{result.summary.ambiguous}</p>
                </div>
                <div className="col-span-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-center sm:col-span-2 md:col-span-2">
                  <span className="text-xs text-slate-500">Pinned Scheme Version</span>
                  <p className="text-xs font-semibold text-slate-800">
                    {result.schemeCode} (v{result.versionNumber}) &bull;{" "}
                    {new Date(result.evaluatedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Rule-by-Rule Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Rule Evaluation Breakdown ({result.ruleResults.length} Rules)
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Run ID: {result.runId.slice(0, 8)}...
                  </span>
                </div>

                <div className="overflow-hidden rounded-md border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/75 text-slate-600">
                      <tr>
                        <th className="p-3">Rule &amp; Criteria</th>
                        <th className="p-3">Outcome</th>
                        <th className="p-3">Resolved / Value</th>
                        <th className="p-3">Expected Threshold</th>
                        <th className="p-3">Severity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {result.ruleResults.map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 font-medium text-slate-900">
                            <div className="font-semibold text-slate-800">{r.ruleName}</div>
                            <div className="text-[11px] text-slate-500">{r.ruleDescription}</div>
                            {r.failureReason && (
                              <div className="mt-1 flex items-start gap-1 rounded bg-amber-50 p-1.5 text-[11px] text-amber-800">
                                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                                <span>{r.failureReason}</span>
                              </div>
                            )}
                            {r.appliedRelaxation && (
                              <div className="mt-1 inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700">
                                <Sparkles className="h-3 w-3 text-blue-500" />
                                <span>{r.appliedRelaxation.reason}</span>
                              </div>
                            )}
                          </td>
                          <td className="p-3">{getOutcomeBadge(r.outcome)}</td>
                          <td className="p-3 font-mono text-slate-700">{r.computedValue || "—"}</td>
                          <td className="p-3 font-mono text-slate-700">{r.expectedValue || "—"}</td>
                          <td className="p-3">
                            <span
                              className={`inline-block rounded px-2 py-0.5 text-[10px] font-medium ${
                                r.severity === "HARD_FAIL"
                                  ? "bg-slate-100 text-slate-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {r.severity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cross-Document Consistency Matrix */}
              {result.consistencyChecks && result.consistencyChecks.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gov-slate" />
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Cross-Document Consistency Verification
                    </h4>
                  </div>

                  <div className="overflow-hidden rounded-md border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/75 text-slate-600">
                        <tr>
                          <th className="p-3">Field</th>
                          <th className="p-3">Declared in Form</th>
                          <th className="p-3">Extracted in Document</th>
                          <th className="p-3">Doc Type &amp; Confidence</th>
                          <th className="p-3">Consistency</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {result.consistencyChecks.map((chk, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3 font-medium text-slate-800">{chk.fieldLabel}</td>
                            <td className="p-3 text-slate-700">{chk.formValue}</td>
                            <td className="p-3 text-slate-700">
                              <div>{chk.extractedValue}</div>
                              {chk.mismatchExplanation && (
                                <div className="mt-1 text-[11px] text-amber-700">
                                  {chk.mismatchExplanation}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-slate-600">
                              <span className="font-medium">{chk.documentType}</span>
                              <div className="text-[11px] text-slate-500">
                                Confidence: {Math.round(chk.extractedConfidence * 100)}%
                              </div>
                            </td>
                            <td className="p-3">
                              {chk.isConsistent ? (
                                <Badge variant="success" className="text-[10px]">
                                  Consistent
                                </Badge>
                              ) : (
                                <Badge variant="warning" className="text-[10px]">
                                  Review Required
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Human Oversight Advisory */}
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-gov-slate" />
                  <div>
                    <span className="font-semibold text-slate-800">
                      Human-in-the-Loop Verification Protocol:
                    </span>{" "}
                    This automated assessment is provided to accelerate desk verification. It does
                    not alter applicant status autonomously. Verification Officers retain sole
                    authority to approve, issue targeted deficiencies (Phase 2H), or escalate to the
                    selection committee.
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
