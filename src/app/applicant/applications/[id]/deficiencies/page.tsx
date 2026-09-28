"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeficiencyResolutionCard } from "@/components/application/deficiency-resolution-card";
import { ApplicantDeficiencyDTO, DeficiencySummaryDTO } from "@/server/domain/deficiency/types";

export default function ApplicantDeficienciesPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = String(params.id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deficiencies, setDeficiencies] = useState<ApplicantDeficiencyDTO[]>([]);
  const [summary, setSummary] = useState<DeficiencySummaryDTO>({
    totalDeficiencies: 0,
    openCount: 0,
    resolvedCount: 0,
    waivedCount: 0,
    applicantActionRequired: false,
    nextAction: "",
  });

  const loadDeficiencies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/applicant/applications/${applicationId}/deficiencies`);
      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.error || "Failed to load deficiencies");
      }
      setDeficiencies(json.data.deficiencies || []);
      setSummary(
        json.data.summary || {
          totalCount: 0,
          openCount: 0,
          resolvedCount: 0,
          waivedCount: 0,
          expiredCount: 0,
          hasBlockers: false,
        }
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [applicationId, router]);

  useEffect(() => {
    loadDeficiencies();
  }, [loadDeficiencies]);

  return (
    <div className="mx-auto max-w-5xl space-y-6" data-testid="applicant-deficiencies-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={`/applicant/applications/${applicationId}/status`}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="h-4 w-4" />
              Back to Status
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-white p-8">
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-gov-navy" />
            <span className="text-sm font-medium">Loading deficiencies &amp; remedies...</span>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
          {error}
        </div>
      ) : (
        <DeficiencyResolutionCard
          applicationId={applicationId}
          initialDeficiencies={deficiencies}
          initialSummary={summary}
          onRefresh={loadDeficiencies}
        />
      )}
    </div>
  );
}
