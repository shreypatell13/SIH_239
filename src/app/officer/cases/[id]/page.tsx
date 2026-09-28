"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { OfficerCaseDetailDTO } from "@/server/domain/officer/types";
import { SplitScreenWorkspace } from "@/components/officer/split-screen-workspace";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";

export default function OfficerCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = String(params.id);

  const [data, setData] = useState<OfficerCaseDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/officer/cases/${caseId}`)
      .then((res) => res.json())
      .then((json) => {
        if (!mounted) return;
        if (json.success && json.data) {
          setData(json.data);
        } else {
          setError(json.error || "Case Dossier not found.");
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || "Failed to load case workspace.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [caseId]);

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-gov-slate" />
        <div className="text-sm font-medium text-slate-600">
          Loading Officer Workspace &amp; OCR Evidence...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-8">
        <Link href="/officer">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Queue
          </Button>
        </Link>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-rose-800">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="h-4 w-4 text-rose-600" />
            {error || "Case dossier could not be loaded."}
          </div>
          <p className="mt-1 text-xs text-rose-600">
            Verify the case or application ID is valid and that you have sufficient permissions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 px-2 sm:px-4">
      <div className="flex items-center justify-between">
        <Link href="/officer">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Queue
          </Button>
        </Link>
      </div>

      <SplitScreenWorkspace
        initialData={data}
        currentOfficerId={data.caseDossier.officerAssignedId || undefined}
      />
    </div>
  );
}
