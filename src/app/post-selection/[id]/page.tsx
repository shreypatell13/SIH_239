"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ScholarDetailWorkspace } from "@/components/post-selection/scholar-detail-workspace";
import { ScholarDetailDTO } from "@/server/domain/post-selection/types";
import { GraduationCap, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ScholarDetailPage() {
  const params = useParams();
  const scholarId = params.id as string;
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "APPLICANT";

  const [scholar, setScholar] = useState<ScholarDetailDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScholarDetail = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/post-selection/scholars/${scholarId}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to load scholar details.");
      }
      setScholar(json.data);
    } catch (e: any) {
      setError(e.message || "Failed to load scholar details.");
    } finally {
      setIsLoading(false);
    }
  }, [scholarId]);

  useEffect(() => {
    if (scholarId) {
      fetchScholarDetail();
    }
  }, [scholarId, fetchScholarDetail]);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gov-slate border-t-transparent"></div>
        <p className="mt-3 text-sm font-medium text-slate-500">
          Loading scholar detail workspace...
        </p>
      </div>
    );
  }

  if (error || !scholar) {
    return (
      <div className="container mx-auto max-w-xl space-y-4 px-4 py-16 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Scholar Record Unavailable</h2>
        <p className="text-xs text-slate-500">
          {error || "Could not retrieve the requested scholar record."}
        </p>
        <Link href="/post-selection">
          <Button variant="outline" size="sm" className="mt-2 gap-1 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Scholar Registry</span>
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <ScholarDetailWorkspace
        scholar={scholar}
        userRole={userRole}
        onRefresh={fetchScholarDetail}
      />
    </div>
  );
}
