"use client";

import React from "react";
import { useParams } from "next/navigation";
import { ExplainableCaseStatus } from "@/components/application/explainable-case-status";

export default function ApplicationStatusPage() {
  const params = useParams();
  const applicationId = String(params.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6" data-testid="application-status-page">
      <ExplainableCaseStatus applicationId={applicationId} />
    </div>
  );
}
