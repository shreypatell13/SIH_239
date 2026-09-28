"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NewApplicationInitiatePage() {
  const params = useParams();
  const router = useRouter();
  const schemeCode = String(params.schemeCode);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const initiatedRef = useRef(false);

  useEffect(() => {
    if (initiatedRef.current) return;
    initiatedRef.current = true;

    fetch("/api/applicant/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schemeCode }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (!json.success || !json.data) {
          throw new Error(json.error?.message || "Failed to initiate application");
        }
        router.push(`/applicant/applications/${json.data.id}`);
      })
      .catch((err) => {
        setErrorMsg(err.message || "Error initiating application");
      });
  }, [schemeCode, router]);

  if (errorMsg) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-6 text-center">
        <div className="space-y-2 rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
          <h3 className="text-base font-bold">Unable to Start Application</h3>
          <p>{errorMsg}</p>
        </div>
        <Link href="/applicant/schemes">
          <Button variant="outline" size="sm">
            Back to Scheme Explorer
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 p-8">
      <Loader2 className="h-8 w-8 animate-spin text-gov-navy" />
      <span className="text-sm font-medium text-slate-700">
        Initiating {schemeCode} scholarship application &amp; Case Dossier...
      </span>
    </div>
  );
}
