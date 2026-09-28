"use client";

import React, { useState, useEffect } from "react";
import { ApplicantProfileDTO } from "@/server/domain/application/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Save, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ApplicantProfilePage() {
  const [profile, setProfile] = useState<ApplicantProfileDTO | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  useEffect(() => {
    fetch("/api/applicant/profile")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          setProfile(json.data);
          setFormData({
            stateDomicile: json.data.stateDomicile || "",
            district: json.data.district || "",
            mobile: json.data.mobile || "",
            aadhaarLast4: json.data.aadhaarLast4 || "",
            academicQualification: json.data.academicQualification || "",
            institutionName: json.data.institutionName || "",
            yearOfPassing: json.data.yearOfPassing || "",
            percentageObtained: json.data.percentageObtained || "",
            annualFamilyIncome: json.data.annualFamilyIncome || "",
            gender: json.data.gender || "",
          });
        }
      })
      .catch((err) => {
        setFeedback({ type: "error", message: err.message || "Failed to load profile" });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const payload = {
        stateDomicile: formData.stateDomicile || null,
        district: formData.district || null,
        mobile: formData.mobile || null,
        aadhaarLast4: formData.aadhaarLast4 || null,
        academicQualification: formData.academicQualification || null,
        institutionName: formData.institutionName || null,
        yearOfPassing: formData.yearOfPassing ? Number(formData.yearOfPassing) : null,
        percentageObtained: formData.percentageObtained
          ? Number(formData.percentageObtained)
          : null,
        annualFamilyIncome: formData.annualFamilyIncome
          ? Number(formData.annualFamilyIncome)
          : null,
        gender: formData.gender || null,
      };

      const res = await fetch("/api/applicant/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to update profile");
      }

      setProfile(json.data);
      setFeedback({ type: "success", message: "Profile details updated successfully!" });
    } catch (err: unknown) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Save failed" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gov-navy" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/applicant">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Candidate Profile</h1>
            <p className="text-xs text-slate-500">
              Manage permanent biographical and academic details for scholarship verification.
            </p>
          </div>
        </div>

        <Badge variant="outline" className="text-xs">
          Role: APPLICANT
        </Badge>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-md p-4 text-sm ${
            feedback.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSave}>
        <Card className="border-slate-200">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-gov-navy" />
                <CardTitle className="text-base">Biographical &amp; Academic Data</CardTitle>
              </div>
              <Badge variant="success">Category: {profile?.category || "ST"}</Badge>
            </div>
            <CardDescription className="text-xs">
              Candidate: <strong>{profile?.fullName}</strong> ({profile?.email})
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="gender" className="text-xs font-medium">
                  Gender
                </Label>
                <select
                  id="gender"
                  value={String(formData.gender || "")}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">-- Select Gender --</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stateDomicile" className="text-xs font-medium">
                  State Domicile
                </Label>
                <Input
                  id="stateDomicile"
                  placeholder="e.g. Rajasthan, Odisha, Jharkhand"
                  value={String(formData.stateDomicile || "")}
                  onChange={(e) => setFormData({ ...formData, stateDomicile: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="district" className="text-xs font-medium">
                  District
                </Label>
                <Input
                  id="district"
                  placeholder="e.g. Udaipur, Mayurbhanj"
                  value={String(formData.district || "")}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mobile" className="text-xs font-medium">
                  Mobile Number (10 Digits)
                </Label>
                <Input
                  id="mobile"
                  placeholder="e.g. 9876543210"
                  maxLength={10}
                  value={String(formData.mobile || "")}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="aadhaarLast4" className="text-xs font-medium">
                  Aadhaar (Last 4 Digits)
                </Label>
                <Input
                  id="aadhaarLast4"
                  placeholder="e.g. 8834"
                  maxLength={4}
                  value={String(formData.aadhaarLast4 || "")}
                  onChange={(e) => setFormData({ ...formData, aadhaarLast4: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="annualFamilyIncome" className="text-xs font-medium">
                  Annual Family Income (&#8377;)
                </Label>
                <Input
                  id="annualFamilyIncome"
                  type="number"
                  placeholder="e.g. 250000"
                  value={String(formData.annualFamilyIncome || "")}
                  onChange={(e) => setFormData({ ...formData, annualFamilyIncome: e.target.value })}
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="academicQualification" className="text-xs font-medium">
                  Highest Qualifying Academic Degree
                </Label>
                <Input
                  id="academicQualification"
                  placeholder="e.g. Master of Science (Computer Science)"
                  value={String(formData.academicQualification || "")}
                  onChange={(e) =>
                    setFormData({ ...formData, academicQualification: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="institutionName" className="text-xs font-medium">
                  Institution / University Name
                </Label>
                <Input
                  id="institutionName"
                  placeholder="e.g. Delhi University / IIT Bombay"
                  value={String(formData.institutionName || "")}
                  onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="percentageObtained" className="text-xs font-medium">
                  Percentage Marks (%)
                </Label>
                <Input
                  id="percentageObtained"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="e.g. 74.5"
                  value={String(formData.percentageObtained || "")}
                  onChange={(e) => setFormData({ ...formData, percentageObtained: e.target.value })}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-end border-t border-slate-100 pt-4">
            <Button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 bg-gov-navy text-white hover:bg-gov-navy/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Candidate Profile
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
