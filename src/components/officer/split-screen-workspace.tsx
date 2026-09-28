"use client";

import React, { useState } from "react";
import {
  OfficerCaseDetailDTO,
  ExtractedEvidenceFieldDTO,
  OfficerDocumentItemDTO,
} from "@/server/domain/officer/types";
import { CaseWorkspaceHeader } from "./case-workspace-header";
import { CaseOverviewTab } from "./left-pane/case-overview-tab";
import { EligibilityTab } from "./left-pane/eligibility-tab";
import { DeficienciesTab } from "./left-pane/deficiencies-tab";
import { TimelineTab } from "./left-pane/timeline-tab";
import { DocumentViewerPane } from "./right-pane/document-viewer-pane";
import { OfficerActionBar } from "./action-bar/officer-action-bar";
import { User, Layers, AlertCircle, Clock, Eye, RotateCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SplitScreenWorkspaceProps {
  initialData: OfficerCaseDetailDTO;
  currentOfficerId?: string;
}

export function SplitScreenWorkspace({ initialData, currentOfficerId }: SplitScreenWorkspaceProps) {
  const [data, setData] = useState<OfficerCaseDetailDTO>(initialData);
  const [activeLeftTab, setActiveLeftTab] = useState<
    "overview" | "eligibility" | "deficiencies" | "timeline"
  >("overview");
  const [selectedDocId, setSelectedDocId] = useState<string>(initialData.documents[0]?.id || "");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedField, setSelectedField] = useState<ExtractedEvidenceFieldDTO | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Issue Deficiency Modal State
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueType, setIssueType] = useState("DOCUMENT_ILLEGIBLE");
  const [issueDocType, setIssueDocType] = useState<string>(
    initialData.documents[0]?.documentType || "CASTE_CERTIFICATE"
  );
  const [issueCustomDesc, setIssueCustomDesc] = useState("");
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);

  const refreshCase = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/officer/cases/${data.caseDossier.id}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data);
      }
    } catch {
      // Keep existing
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Bi-directional Navigation: Left pane evidence click -> Right pane document viewer
   */
  const handleSelectEvidence = (fieldId: string) => {
    // Search across all documents for this field
    for (const doc of data.documents) {
      const found = doc.extractedFields.find((f) => f.id === fieldId);
      if (found) {
        setSelectedDocId(doc.id);
        setCurrentPage(found.pageNumber || 1);
        setSelectedField(found);
        return;
      }
    }
  };

  const handleIssueDeficiencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingIssue(true);
    setIssueError(null);
    try {
      const res = await fetch(`/api/officer/applications/${data.application.id}/deficiencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseDossierId: data.caseDossier.id,
          deficiencyType: issueType,
          documentType: issueDocType,
          customDescription: issueCustomDesc.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to issue deficiency.");
      }

      setShowIssueModal(false);
      setIssueCustomDesc("");
      refreshCase();
    } catch (err) {
      setIssueError((err as Error).message);
    } finally {
      setSubmittingIssue(false);
    }
  };

  const hasOpenDeficiencies = data.deficiencies.some((d) => d.status === "OPEN");

  return (
    <div className="space-y-4" data-testid="split-screen-workspace-container">
      {/* 1. Master Header */}
      <CaseWorkspaceHeader
        data={data}
        currentOfficerId={currentOfficerId}
        onCaseClaimed={refreshCase}
      />

      {/* 2. Split Screen Body */}
      <div className="grid min-h-[680px] grid-cols-1 gap-4 lg:grid-cols-12">
        {/* LEFT PANE (5 cols on lg, scrollable) */}
        <div className="flex flex-col space-y-3 lg:col-span-6">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 text-xs shadow-sm">
            <button
              type="button"
              onClick={() => setActiveLeftTab("overview")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 font-semibold transition-colors ${
                activeLeftTab === "overview"
                  ? "bg-gov-slate text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              data-testid="tab-overview"
            >
              <User className="h-3.5 w-3.5" />
              Overview
            </button>

            <button
              type="button"
              onClick={() => setActiveLeftTab("eligibility")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 font-semibold transition-colors ${
                activeLeftTab === "eligibility"
                  ? "bg-gov-slate text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              data-testid="tab-eligibility"
            >
              <Layers className="h-3.5 w-3.5" />
              Eligibility
              {data.eligibility.failedRulesCount > 0 && (
                <span className="h-2 w-2 rounded-full bg-rose-500" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveLeftTab("deficiencies")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 font-semibold transition-colors ${
                activeLeftTab === "deficiencies"
                  ? "bg-gov-slate text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              data-testid="tab-deficiencies"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              Deficiencies ({data.deficiencies.filter((d) => d.status === "OPEN").length})
            </button>

            <button
              type="button"
              onClick={() => setActiveLeftTab("timeline")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 font-semibold transition-colors ${
                activeLeftTab === "timeline"
                  ? "bg-gov-slate text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              data-testid="tab-timeline"
            >
              <Clock className="h-3.5 w-3.5" />
              Timeline
            </button>
          </div>

          {/* Active Left Tab Content */}
          <div className="max-h-[750px] flex-1 overflow-y-auto pr-1">
            {activeLeftTab === "overview" && <CaseOverviewTab data={data} />}
            {activeLeftTab === "eligibility" && (
              <EligibilityTab
                data={data}
                onSelectEvidence={handleSelectEvidence}
                onReevaluated={refreshCase}
              />
            )}
            {activeLeftTab === "deficiencies" && (
              <DeficienciesTab
                data={data}
                onDeficiencyUpdated={refreshCase}
                onIssueNewDeficiency={() => setShowIssueModal(true)}
              />
            )}
            {activeLeftTab === "timeline" && <TimelineTab timeline={data.timeline} />}
          </div>
        </div>

        {/* RIGHT PANE (6 cols on lg, sticky viewer) */}
        <div className="space-y-3 lg:col-span-6">
          <DocumentViewerPane
            documents={data.documents}
            selectedDocumentId={selectedDocId}
            onSelectDocument={(id) => setSelectedDocId(id)}
            selectedField={selectedField}
            onSelectField={(f) => setSelectedField(f)}
            currentPage={currentPage}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      </div>

      {/* 3. Sticky Bottom Action Bar */}
      <OfficerActionBar
        caseId={data.caseDossier.id}
        currentStage={data.caseDossier.currentStage}
        hasOpenDeficiencies={hasOpenDeficiencies}
        onActionCompleted={refreshCase}
        onIssueDeficiencyTrigger={() => setShowIssueModal(true)}
      />

      {/* Issue Deficiency Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg space-y-4 rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Issue Structured Deficiency</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIssueModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {issueError && (
              <div className="rounded border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
                {issueError}
              </div>
            )}

            <form onSubmit={handleIssueDeficiencySubmit} className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Deficiency Type</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-gov-slate"
                >
                  <option value="DOCUMENT_ILLEGIBLE">Document Illegible / Blurry Scan</option>
                  <option value="DATA_MISMATCH">Data Mismatch with Form Input</option>
                  <option value="AUTHORITY_SEAL_MISSING">Authority Seal / Signature Faded</option>
                  <option value="DOCUMENT_EXPIRED">Document Expired / Out of Date</option>
                  <option value="DOCUMENT_MISSING">Document Incomplete / Pages Missing</option>
                  <option value="CUSTOM">Other / Custom Clarification</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">Target Document</label>
                <select
                  value={issueDocType}
                  onChange={(e) => setIssueDocType(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-gov-slate"
                >
                  {data.documents.map((d) => (
                    <option key={d.id} value={d.documentType}>
                      {d.documentType.replace(/_/g, " ")} ({d.originalFilename})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Custom Description / Instructions for Candidate (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Please upload a high-contrast scan showing the Tehsildar issue seal clearly."
                  value={issueCustomDesc}
                  onChange={(e) => setIssueCustomDesc(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-gov-slate"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowIssueModal(false)}
                  disabled={submittingIssue}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="default" size="sm" disabled={submittingIssue}>
                  {submittingIssue ? "Issuing..." : "Issue Deficiency (15-Day SLA)"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
