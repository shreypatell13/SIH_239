"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ScholarDetailDTO,
  RenewalDTO,
  DisbursementDTO,
} from "@/server/domain/post-selection/types";
import {
  GraduationCap,
  ArrowLeft,
  Calendar,
  Building2,
  User,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  History,
  Send,
  Edit3,
} from "lucide-react";
import { SubmitRenewalDialog } from "./submit-renewal-dialog";
import { ReviewRenewalDialog } from "./review-renewal-dialog";
import { UpdateDisbursementDialog } from "./update-disbursement-dialog";

interface ScholarDetailWorkspaceProps {
  scholar: ScholarDetailDTO;
  userRole: string;
  onRefresh: () => void;
}

export function ScholarDetailWorkspace({
  scholar,
  userRole,
  onRefresh,
}: ScholarDetailWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "renewals" | "disbursements" | "documents" | "audit"
  >("overview");
  const [selectedRenewalForSubmit, setSelectedRenewalForSubmit] = useState<RenewalDTO | null>(null);
  const [selectedRenewalForReview, setSelectedRenewalForReview] = useState<RenewalDTO | null>(null);
  const [selectedDisbursement, setSelectedDisbursement] = useState<DisbursementDTO | null>(null);

  const isOfficerOrAdmin =
    userRole === "VERIFICATION_OFFICER" ||
    userRole === "SCHEME_ADMIN" ||
    userRole === "OPERATIONS_DIRECTOR";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800">
            Active Scholar
          </Badge>
        );
      case "RENEWAL_DUE":
        return <Badge className="border-amber-200 bg-amber-100 text-amber-800">Renewal Due</Badge>;
      case "ON_HOLD":
        return <Badge className="border-rose-200 bg-rose-100 text-rose-800">On Hold</Badge>;
      case "COMPLETED":
        return (
          <Badge className="border-blue-200 bg-blue-100 text-blue-800">Tenure Completed</Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6" data-testid="scholar-detail-workspace">
      {/* Back link & Header */}
      <div className="flex flex-col gap-4 rounded-xl border-b border-slate-200 bg-white p-4 pb-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/post-selection">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
              data-testid="back-to-registry-btn"
            >
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900" data-testid="scholar-name-heading">
                {scholar.applicantName}
              </h2>
              <Badge variant="outline" className="bg-slate-50 font-semibold text-gov-slate">
                {scholar.schemeCode} (v{scholar.schemeVersionNumber})
              </Badge>
              {getStatusBadge(scholar.scholarStatus)}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>
                Case: <strong className="font-mono text-slate-700">{scholar.caseNumber}</strong>
              </span>
              <span>&bull;</span>
              <span>
                App:{" "}
                <strong className="font-mono text-slate-700">{scholar.applicationNumber}</strong>
              </span>
              <span>&bull;</span>
              <span>
                Category: <strong className="text-slate-700">{scholar.category}</strong>
              </span>
              {scholar.stateDomicile && (
                <>
                  <span>&bull;</span>
                  <span>
                    Domicile: <strong className="text-slate-700">{scholar.stateDomicile}</strong>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Awarded Financials Card */}
        <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Awarded Fellowship
            </div>
            <div className="text-lg font-bold text-slate-900">
              ₹{scholar.awardedAmount.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Tenure Cycle
            </div>
            <div className="text-sm font-semibold text-slate-700">
              Year {scholar.currentYear} of {scholar.totalTenureYears}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex rounded-t-lg border-b border-slate-200 bg-white px-2">
        {[
          { id: "overview", label: "Academic & Tenure Overview", icon: GraduationCap },
          { id: "renewals", label: `Annual Renewals (${scholar.renewals.length})`, icon: Clock },
          {
            id: "disbursements",
            label: `Mock Disbursements (${scholar.disbursements.length})`,
            icon: IndianRupee,
          },
          {
            id: "documents",
            label: `Evidence Documents (${scholar.documents.length})`,
            icon: FileText,
          },
          { id: "audit", label: `Audit Log (${scholar.auditLogs.length})`, icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-medium transition-colors ${
                isActive
                  ? "border-gov-slate font-semibold text-gov-slate"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Building2 className="h-4 w-4 text-gov-slate" />
                <span>Fellowship &amp; Research Affiliation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Host University / Institution:</span>
                <span className="text-right font-medium text-slate-800">
                  {scholar.researchInstitution || "Designated Institution"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Research Supervisor / Guide:</span>
                <span className="font-medium text-slate-800">
                  {scholar.supervisorName || "Assigned Department Supervisor"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Fellowship Cadre:</span>
                <span className="font-medium text-slate-800">
                  {scholar.fellowshipType || "Junior Research Fellow (JRF)"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Tenure Duration:</span>
                <span className="font-medium text-slate-800">
                  {new Date(scholar.tenureStartDate).toLocaleDateString()} to{" "}
                  {new Date(scholar.tenureEndDate).toLocaleDateString()} ({scholar.totalTenureYears}{" "}
                  Years)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Continuation Status:</span>
                <span className="font-medium text-emerald-700">
                  {scholar.continuationApproved
                    ? "Approved by Committee"
                    : "Active Standard Tenure"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <User className="h-4 w-4 text-gov-slate" />
                <span>Scholar Demographic &amp; Academic Background</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Scholar Email:</span>
                <span className="font-mono text-slate-800">{scholar.applicantEmail}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Qualifying Degree:</span>
                <span className="font-medium text-slate-800">
                  {scholar.academicQualification || "Master's Degree"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Aadhaar Last 4:</span>
                <span className="font-mono text-slate-800">
                  {scholar.aadhaarLast4 ? `•••• ${scholar.aadhaarLast4}` : "Verified"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Next Renewal Due Date:</span>
                <span className="font-medium text-amber-800">
                  {scholar.renewalDueDate
                    ? new Date(scholar.renewalDueDate).toLocaleDateString()
                    : "Standard Annual Cycle"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PFMS Batch Reference:</span>
                <span className="font-mono text-slate-800">
                  {scholar.pfmsReferenceId || "Batch Active"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Renewals */}
      {activeTab === "renewals" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              Multi-Year Annual Renewal &amp; Progress History
            </h3>
          </div>

          <div className="space-y-3">
            {scholar.renewals.map((r) => (
              <Card key={r.id} className="border-slate-200" data-testid={`renewal-card-${r.id}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          Year {r.renewalCycle} Annual Renewal
                        </span>
                        <Badge variant="outline" className="bg-slate-50 text-xs">
                          {r.academicYear}
                        </Badge>
                        <Badge
                          className={`text-xs ${
                            r.status === "APPROVED"
                              ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                              : r.status === "DEFICIENT"
                                ? "border-rose-200 bg-rose-100 text-rose-800"
                                : r.status === "UNDER_REVIEW"
                                  ? "border-indigo-200 bg-indigo-100 text-indigo-800"
                                  : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {r.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Supervisor Recommendation:{" "}
                        <strong className="text-slate-700">
                          {r.supervisorRecommendation || "Awaiting submission"}
                        </strong>
                        {r.publicationsCount > 0 && ` • ${r.publicationsCount} Publications`}
                        {r.conferencesAttended > 0 && ` • ${r.conferencesAttended} Conferences`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {(r.status === "UPCOMING" ||
                        r.status === "DEFICIENT" ||
                        r.status === "DRAFT") && (
                        <Button
                          size="sm"
                          className="gap-1.5 bg-gov-saffron text-xs font-semibold text-slate-950 hover:bg-amber-600"
                          onClick={() => setSelectedRenewalForSubmit(r)}
                          data-testid={`scholar-submit-renewal-btn-${r.id}`}
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Submit Annual Progress</span>
                        </Button>
                      )}

                      {isOfficerOrAdmin &&
                        (r.status === "SUBMITTED" || r.status === "UNDER_REVIEW") && (
                          <Button
                            size="sm"
                            className="gap-1.5 bg-gov-slate text-xs hover:bg-slate-800"
                            onClick={() => setSelectedRenewalForReview(r)}
                            data-testid={`officer-review-renewal-btn-${r.id}`}
                          >
                            <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                            <span>Adjudicate Cycle</span>
                          </Button>
                        )}
                    </div>
                  </div>

                  {r.progressSummary && (
                    <div className="mt-3 rounded border border-slate-100 bg-slate-50 p-2.5 text-xs">
                      <span className="font-semibold text-slate-700">Progress Narrative: </span>
                      <span className="text-slate-600">{r.progressSummary}</span>
                    </div>
                  )}

                  {r.officerRemarks && (
                    <div className="mt-2 rounded border border-blue-100 bg-blue-50/50 p-2.5 text-xs text-blue-900">
                      <span className="font-semibold">Officer Remarks: </span>
                      <span>{r.officerRemarks}</span>
                      {r.reviewedByName && (
                        <span className="ml-1 text-slate-500">({r.reviewedByName})</span>
                      )}
                    </div>
                  )}

                  {r.deficiencyDetails && (
                    <div className="mt-2 flex items-start gap-2 rounded border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                      <div>
                        <span className="font-semibold">Deficiency Resolution Notice: </span>
                        <span>{r.deficiencyDetails}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Disbursements */}
      {activeTab === "disbursements" && (
        <div className="space-y-4">
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <strong>PFMS Direct Benefit Transfer (Simulated):</strong> Multi-installment
            disbursement tracking against fellowship sanction orders.
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm" data-testid="scholar-disbursements-table">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Installment</th>
                  <th className="px-4 py-3">Financial Year</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">PFMS Transaction Reference</th>
                  <th className="px-4 py-3">Disbursement Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {scholar.disbursements.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-slate-50"
                    data-testid={`scholar-disbursement-row-${d.id}`}
                  >
                    <td className="px-4 py-3.5 font-semibold text-slate-800">
                      Installment {d.installmentNumber}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{d.financialYear}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      ₹{d.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-700">
                      {d.pfmsReference || "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        className={`${
                          d.status === "PAID"
                            ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                            : d.status === "PROCESSING"
                              ? "border-indigo-200 bg-indigo-100 text-indigo-800"
                              : d.status === "HELD"
                                ? "border-rose-200 bg-rose-100 text-rose-800"
                                : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {d.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {isOfficerOrAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 border-slate-300 text-xs hover:bg-slate-100"
                          onClick={() => setSelectedDisbursement(d)}
                          data-testid={`edit-disbursement-btn-${d.id}`}
                        >
                          <Edit3 className="mr-1 h-3.5 w-3.5" />
                          <span>Update</span>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Documents */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800">
            Verified Evidence &amp; Supporting Certificates
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {scholar.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="h-5 w-5 shrink-0 text-gov-slate" />
                  <div>
                    <div className="text-xs font-semibold text-slate-800">
                      {doc.documentType.replace(/_/g, " ")}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {doc.originalFilename} ({(doc.fileSizeBytes / 1024).toFixed(1)} KB)
                    </div>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700"
                >
                  VERIFIED
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Audit Trail */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800">
            Immutable Post-Selection Lifecycle Audit Trail
          </h3>
          <div className="space-y-2">
            {scholar.auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-800">{log.actionType}</span>
                  {log.actorName && (
                    <span className="ml-2 text-slate-500">
                      by {log.actorName} ({log.actorRole})
                    </span>
                  )}
                  {log.previousState && log.newState && (
                    <div className="mt-0.5 text-[11px] text-slate-400">
                      State: <span className="font-mono text-slate-600">{log.previousState}</span>{" "}
                      &rarr; <span className="font-mono text-slate-600">{log.newState}</span>
                    </div>
                  )}
                </div>
                <div className="font-mono text-[11px] text-slate-400">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <SubmitRenewalDialog
        renewal={selectedRenewalForSubmit}
        isOpen={!!selectedRenewalForSubmit}
        onClose={() => setSelectedRenewalForSubmit(null)}
        onSuccess={onRefresh}
      />

      <ReviewRenewalDialog
        renewal={selectedRenewalForReview}
        isOpen={!!selectedRenewalForReview}
        onClose={() => setSelectedRenewalForReview(null)}
        onSuccess={onRefresh}
      />

      <UpdateDisbursementDialog
        disbursement={selectedDisbursement}
        isOpen={!!selectedDisbursement}
        onClose={() => setSelectedDisbursement(null)}
        onSuccess={onRefresh}
      />
    </div>
  );
}
