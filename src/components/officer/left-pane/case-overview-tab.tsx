"use client";

import React from "react";
import { OfficerCaseDetailDTO } from "@/server/domain/officer/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, BookOpen, FileCheck, Info, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface CaseOverviewTabProps {
  data: OfficerCaseDetailDTO;
}

export function CaseOverviewTab({ data }: CaseOverviewTabProps) {
  const { applicant, application, scheme, documents } = data;

  return (
    <div className="space-y-4" data-testid="case-overview-tab">
      {/* 1. Demographic Profile */}
      <Card className="border-slate-200 shadow-none">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gov-slate" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Applicant Demographic Profile
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 p-4 text-xs">
          <div>
            <span className="block text-slate-400">Full Name</span>
            <span className="font-semibold text-slate-900">{applicant.name}</span>
          </div>
          <div>
            <span className="block text-slate-400">Social Category</span>
            <Badge variant="outline" className="font-semibold text-slate-800">
              {applicant.category}
            </Badge>
          </div>
          <div>
            <span className="block text-slate-400">Date of Birth</span>
            <span className="text-slate-800">
              {applicant.dateOfBirth
                ? new Date(applicant.dateOfBirth).toLocaleDateString("en-IN")
                : "Not Provided"}
            </span>
          </div>
          <div>
            <span className="block text-slate-400">Gender</span>
            <span className="text-slate-800">{applicant.gender || "Not Provided"}</span>
          </div>
          <div>
            <span className="block text-slate-400">State Domicile</span>
            <span className="text-slate-800">{applicant.stateDomicile || "Not Provided"}</span>
          </div>
          <div>
            <span className="block text-slate-400">District</span>
            <span className="text-slate-800">{applicant.district || "Not Provided"}</span>
          </div>
          <div>
            <span className="block text-slate-400">Annual Family Income</span>
            <span className="font-semibold text-slate-900">
              {applicant.annualFamilyIncome !== null && applicant.annualFamilyIncome !== undefined
                ? `₹${applicant.annualFamilyIncome.toLocaleString("en-IN")}`
                : "Not Specified"}
            </span>
          </div>
          <div>
            <span className="block text-slate-400">Aadhaar (Last 4)</span>
            <span className="font-mono text-slate-800">
              {applicant.aadhaarLast4 ? `•••• •••• ${applicant.aadhaarLast4}` : "Verified via Auth"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Academic Qualification */}
      <Card className="border-slate-200 shadow-none">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-gov-slate" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Academic Qualifications &amp; Institution
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 p-4 text-xs">
          <div>
            <span className="block text-slate-400">Qualifying Degree</span>
            <span className="font-medium text-slate-900">
              {applicant.academicQualification || "Not Provided"}
            </span>
          </div>
          <div>
            <span className="block text-slate-400">Passing Year</span>
            <span className="text-slate-800">{applicant.yearOfPassing || "N/A"}</span>
          </div>
          <div className="col-span-2">
            <span className="block text-slate-400">Institution / University</span>
            <span className="text-slate-800">{applicant.institutionName || "Not Provided"}</span>
          </div>
          <div>
            <span className="block text-slate-400">Marks / Percentage</span>
            <span className="font-semibold text-emerald-700">
              {applicant.percentageObtained !== null && applicant.percentageObtained !== undefined
                ? `${applicant.percentageObtained}%`
                : "N/A"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Submitted Form Data */}
      <Card className="border-slate-200 shadow-none">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-gov-slate" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Application Form Payload ({scheme.code} v{scheme.versionNumber})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 p-4 text-xs">
          {Object.keys(application.formData).length === 0 ? (
            <p className="italic text-slate-400">No custom form data recorded.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(application.formData).map(([k, v]) => (
                <div key={k} className="rounded border border-slate-100 bg-slate-50 p-2">
                  <span className="block font-mono text-[11px] text-slate-400">{k}</span>
                  <span className="font-medium text-slate-800">
                    {typeof v === "object" ? JSON.stringify(v) : String(v)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Submitted Documents Summary */}
      <Card className="border-slate-200 shadow-none">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-gov-slate" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Uploaded Evidence Documents ({documents.length})
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {documents.filter((d) => d.processingStatus === "COMPLETED").length} Processed
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 text-xs">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 hover:bg-slate-50">
                <div>
                  <div className="font-medium text-slate-900">
                    {doc.documentType.replace(/_/g, " ")}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {doc.originalFilename} &bull; {(doc.fileSizeBytes / 1024).toFixed(0)} KB &bull;
                    v{doc.version}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      doc.processingStatus === "COMPLETED"
                        ? "success"
                        : doc.processingStatus === "REVIEW_REQUIRED"
                          ? "warning"
                          : "outline"
                    }
                    className="text-[10px]"
                  >
                    {doc.processingStatus}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
