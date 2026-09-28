"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileUp,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Send,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApplicantDeficiencyDTO, DeficiencySummaryDTO } from "@/server/domain/deficiency/types";

interface DeficiencyResolutionCardProps {
  applicationId: string;
  initialDeficiencies: ApplicantDeficiencyDTO[];
  initialSummary: DeficiencySummaryDTO;
  onRefresh?: () => void;
}

export function DeficiencyResolutionCard({
  applicationId,
  initialDeficiencies,
  initialSummary,
  onRefresh,
}: DeficiencyResolutionCardProps) {
  const [deficiencies, setDeficiencies] = useState<ApplicantDeficiencyDTO[]>(initialDeficiencies);
  const [summary, setSummary] = useState<DeficiencySummaryDTO>(initialSummary);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [clarificationText, setClarificationText] = useState("");
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const openDeficiencies = deficiencies.filter((d) => d.status === "OPEN");
  const resolvedDeficiencies = deficiencies.filter((d) => d.status !== "OPEN");

  const handleRespond = async (deficiencyId: string) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const body = replacementFile ? new FormData() : JSON.stringify({ clarificationText });
      if (body instanceof FormData) {
        body.append("clarificationText", clarificationText);
        body.append("file", replacementFile!);
      }
      const res = await fetch(
        `/api/applicant/applications/${applicationId}/deficiencies/${deficiencyId}/respond`,
        {
          method: "POST",
          ...(body instanceof FormData ? {} : { headers: { "Content-Type": "application/json" } }),
          body,
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit response.");
      }

      setSuccessMsg("Your response was submitted. The case may need officer review.");
      setRespondingId(null);
      setClarificationText("");
      setReplacementFile(null);

      // Reload deficiencies
      const refRes = await fetch(`/api/applicant/applications/${applicationId}/deficiencies`);
      const refData = await refRes.json();
      if (refData.success) {
        setDeficiencies(refData.data.deficiencies);
        setSummary(refData.data.summary);
      }

      if (onRefresh) onRefresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 pb-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <AlertCircle
                  className={`h-5 w-5 ${summary.openCount > 0 ? "text-amber-600" : "text-emerald-600"}`}
                />
                <CardTitle className="text-lg font-bold text-slate-900">
                  Application Remediation &amp; Deficiencies
                </CardTitle>
                {summary.openCount > 0 ? (
                  <Badge variant="warning">
                    {summary.openCount} Action{summary.openCount > 1 ? "s" : ""} Required
                  </Badge>
                ) : (
                  <Badge variant="success">All Clear / Resolved</Badge>
                )}
              </div>
              <CardDescription className="text-xs text-slate-500">
                Transparent issue explanations, targeted document replacement, and automated
                rechecks.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-5">
          {error && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Open Deficiencies List */}
          {openDeficiencies.length > 0 ? (
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Outstanding Items Requiring Attention ({openDeficiencies.length})
              </h4>

              <div className="space-y-3">
                {openDeficiencies.map((def) => (
                  <div
                    key={def.id}
                    className="rounded-lg border border-amber-200 bg-amber-50/30 p-4 transition-all"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{def.title}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {def.remedyAction}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600">{def.description}</p>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-amber-700">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Deadline: {new Date(def.responseDeadline).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {def.recheckStatus && (
                      <div className="mt-2.5 flex items-center gap-1 text-[11px] text-slate-500">
                        <RefreshCw className="h-3 w-3 animate-spin text-slate-400" />
                        <span>
                          Recheck Status:{" "}
                          <strong className="text-slate-700">{def.recheckStatus}</strong>
                        </span>
                      </div>
                    )}

                    {/* Remediation Action Form */}
                    <div className="mt-4 border-t border-amber-200/60 pt-3">
                      {respondingId === def.id ? (
                        <div className="space-y-3">
                          <Textarea
                            placeholder="Enter your explanation, clarification, or document issuance details..."
                            value={clarificationText}
                            onChange={(e) => setClarificationText(e.target.value)}
                            rows={3}
                            className="text-xs"
                          />
                          {def.documentType && (
                            <label className="block text-xs text-slate-600">
                              Replacement {def.documentType.replaceAll("_", " ")} (PDF or image)
                              <input
                                type="file"
                                accept="application/pdf,image/jpeg,image/png"
                                onChange={(event) =>
                                  setReplacementFile(event.target.files?.[0] || null)
                                }
                                className="mt-1 block w-full text-xs"
                              />
                            </label>
                          )}
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              disabled={
                                loading ||
                                (clarificationText.trim().length === 0 && !replacementFile)
                              }
                              onClick={() => handleRespond(def.id)}
                              className="bg-gov-slate text-xs text-white hover:bg-slate-800"
                            >
                              <Send className="mr-1.5 h-3.5 w-3.5" />
                              {loading ? "Submitting..." : "Submit Response & Recheck"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setRespondingId(null);
                                setClarificationText("");
                                setReplacementFile(null);
                              }}
                              className="text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRespondingId(def.id);
                              setClarificationText("");
                              setReplacementFile(null);
                            }}
                            className="text-xs"
                          >
                            <MessageSquare className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
                            Provide Written Clarification
                          </Button>

                          {def.documentType && (
                            <button
                              type="button"
                              onClick={() => {
                                setRespondingId(def.id);
                                setClarificationText("");
                                setReplacementFile(null);
                              }}
                              className="inline-flex cursor-pointer items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                            >
                              <FileUp className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
                              Upload Replacement Document
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 py-8 text-center">
              <ShieldCheck className="mb-2 h-8 w-8 text-emerald-600" />
              <p className="text-sm font-semibold text-slate-800">No Open Deficiencies</p>
              <p className="text-xs text-slate-500">
                Your application currently has no outstanding document or verification deficiencies.
              </p>
            </div>
          )}

          {/* Resolved Deficiencies History */}
          {resolvedDeficiencies.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Resolved / Remediated Items ({resolvedDeficiencies.length})
              </h4>

              <div className="space-y-2">
                {resolvedDeficiencies.map((def) => (
                  <div
                    key={def.id}
                    className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50/75 p-3 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <div>
                        <span className="font-medium text-slate-800">{def.title}</span>
                        {def.resolvedAt && (
                          <span className="ml-2 text-[11px] text-slate-500">
                            Resolved on {new Date(def.resolvedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="success" className="text-[10px]">
                      {def.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
