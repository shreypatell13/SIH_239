"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { SchemeVersionDTO } from "@/server/domain/scheme/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Calendar,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import Link from "next/link";

export default function SchemeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const schemeCode = String(params.code);

  const [schemeVersion, setSchemeVersion] = useState<SchemeVersionDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 3-Question Eligibility Pre-Screener State
  const [isStCategory, setIsStCategory] = useState<boolean | null>(null);
  const [isIncomeEligible, setIsIncomeEligible] = useState<boolean | null>(null);
  const [hasAcademicQualification, setHasAcademicQualification] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`/api/schemes/${schemeCode}/active`)
      .then((res) => res.json())
      .then((json) => {
        const ver = json.data || json.version;
        if (!json.success || !ver) {
          throw new Error(json.error?.message || json.error || "Scheme not found");
        }
        setSchemeVersion(ver);
      })
      .catch((err) => {
        setErrorMsg(err.message || "Failed to load scheme details");
      })
      .finally(() => setIsLoading(false));
  }, [schemeCode]);

  const isPreScreenerComplete =
    isStCategory !== null && isIncomeEligible !== null && hasAcademicQualification !== null;
  const isPreScreenerEligible =
    isStCategory === true && isIncomeEligible === true && hasAcademicQualification === true;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gov-navy" />
      </div>
    );
  }

  if (!schemeVersion || errorMsg) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Link href="/applicant/schemes">
          <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs">
            <ArrowLeft className="h-4 w-4" /> Back to Schemes
          </Button>
        </Link>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
          {errorMsg || "Scheme not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8" data-testid={`scheme-detail-${schemeCode}`}>
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/applicant/schemes">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs font-bold text-gov-navy">
                {schemeCode}
              </Badge>
              <h1 className="text-2xl font-bold text-slate-900">
                Scheme Guidelines &amp; Pre-Screener
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Review eligibility criteria and proceed to the dynamic application form.
            </p>
          </div>
        </div>

        <Badge variant="success">Version {schemeVersion.versionNumber} Active</Badge>
      </div>

      {/* Scheme Information Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl text-slate-900">
            {schemeCode === "NFST"
              ? "National Fellowship for Scheduled Tribes (NFST)"
              : "National Overseas Scholarship for ST Candidates (NOS)"}
          </CardTitle>
          <CardDescription className="text-xs text-slate-600">
            Ministry of Tribal Affairs &bull; Higher Education &amp; Research Support
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs text-slate-700">
          <div className="grid grid-cols-1 gap-4 rounded-lg bg-slate-50 p-4 md:grid-cols-2">
            <div>
              <span className="font-semibold text-slate-900">Application Window:</span>
              <p className="mt-0.5 text-slate-600">
                {schemeVersion.applicationDeadline
                  ? `Closes on ${new Date(schemeVersion.applicationDeadline).toLocaleDateString("en-IN")}`
                  : "Open throughout active financial cycle"}
              </p>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Required Documents:</span>
              <p className="mt-0.5 text-slate-600">
                {schemeVersion.documentRequirements?.requirements?.length || 0} Certificate(s) &amp;
                Proofs
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3-Question Eligibility Pre-Screener */}
      <Card className="border-gov-navy/20 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-gov-navy" />
            <CardTitle className="text-base">3-Question Eligibility Pre-Screener</CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500">
            Quick self-assessment before filling the complete application form.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-6 text-xs">
          {/* Question 1 */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-800">
              1. Do you belong to a recognized Scheduled Tribe (ST) community with a valid caste
              certificate?
            </p>
            <div className="flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="q1"
                  checked={isStCategory === true}
                  onChange={() => setIsStCategory(true)}
                  className="h-4 w-4 text-gov-navy focus:ring-gov-slate"
                />
                <span>Yes, I hold a valid ST Certificate</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="q1"
                  checked={isStCategory === false}
                  onChange={() => setIsStCategory(false)}
                  className="h-4 w-4 text-gov-navy focus:ring-gov-slate"
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {/* Question 2 */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-800">
              2. Does your total annual family income meet the criteria for this scheme?
              {schemeCode === "NOS" && " (Ceiling: ≤ ₹8,00,000 per annum)"}
            </p>
            <div className="flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="q2"
                  checked={isIncomeEligible === true}
                  onChange={() => setIsIncomeEligible(true)}
                  className="h-4 w-4 text-gov-navy focus:ring-gov-slate"
                />
                <span>Yes, family income is within limits</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="q2"
                  checked={isIncomeEligible === false}
                  onChange={() => setIsIncomeEligible(false)}
                  className="h-4 w-4 text-gov-navy focus:ring-gov-slate"
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {/* Question 3 */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-800">
              3. Have you secured admission or qualifying academic marks required for this
              fellowship?
              {schemeCode === "NOS"
                ? " (Unconditional foreign admission offer)"
                : " (UGC/CSIR-NET or Ph.D. registration)"}
            </p>
            <div className="flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="q3"
                  checked={hasAcademicQualification === true}
                  onChange={() => setHasAcademicQualification(true)}
                  className="h-4 w-4 text-gov-navy focus:ring-gov-slate"
                />
                <span>Yes, academic criteria satisfied</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="q3"
                  checked={hasAcademicQualification === false}
                  onChange={() => setHasAcademicQualification(false)}
                  className="h-4 w-4 text-gov-navy focus:ring-gov-slate"
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {/* Feedback */}
          {isPreScreenerComplete && (
            <div
              className={`rounded-md p-4 text-xs font-medium ${
                isPreScreenerEligible
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              {isPreScreenerEligible ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                  <span>
                    You appear eligible based on preliminary self-assessment! Click below to start
                    your application.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600" />
                  <span>
                    You may not satisfy one or more criteria. You can still apply, but verify the
                    scheme guidelines carefully.
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-slate-100 pt-4">
          <Link href="/applicant/schemes">
            <Button variant="outline" size="sm" className="text-xs">
              Back
            </Button>
          </Link>

          <Link href={`/applicant/applications/new/${schemeCode}`}>
            <Button className="flex items-center gap-1.5 bg-gov-navy text-xs font-semibold text-white hover:bg-gov-navy/90">
              Start {schemeCode} Application
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
