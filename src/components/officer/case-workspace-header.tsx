"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  UserCheck,
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  RotateCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OfficerCaseDetailDTO } from "@/server/domain/officer/types";

interface CaseWorkspaceHeaderProps {
  data: OfficerCaseDetailDTO;
  currentOfficerId?: string;
  onCaseClaimed?: () => void;
}

export function CaseWorkspaceHeader({
  data,
  currentOfficerId,
  onCaseClaimed,
}: CaseWorkspaceHeaderProps) {
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const isAssignedToCurrent =
    data.caseDossier.officerAssignedId &&
    currentOfficerId &&
    data.caseDossier.officerAssignedId === currentOfficerId;

  const isUnassigned = !data.caseDossier.officerAssignedId;

  const handleClaim = async () => {
    setClaiming(true);
    setClaimError(null);
    try {
      const res = await fetch(`/api/officer/cases/${data.caseDossier.id}/claim`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to claim case.");
      }
      setClaimSuccess(true);
      if (onCaseClaimed) onCaseClaimed();
    } catch (err) {
      setClaimError((err as Error).message);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div
      className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      data-testid="workspace-header"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/officer">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" />
              Queue
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-200" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">{data.applicant.name}</h1>
              <Badge variant="outline" className="font-semibold text-slate-700">
                {data.scheme.name} ({data.scheme.code} v{data.scheme.versionNumber})
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {data.caseDossier.caseNumber}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Scheme: <span className="font-medium text-slate-700">{data.scheme.name}</span> &bull;
              Application: <span className="font-mono">{data.application.applicationNumber}</span>{" "}
              &bull; Category: {data.applicant.category} &bull; State:{" "}
              {data.applicant.stateDomicile || "N/A"}
            </p>
          </div>
        </div>

        {/* Assignment Action */}
        <div className="flex items-center gap-2">
          {isUnassigned ? (
            <Button
              size="sm"
              variant="default"
              onClick={handleClaim}
              disabled={claiming}
              className="gap-1.5 bg-gov-slate text-xs hover:bg-slate-800"
            >
              {claiming ? (
                <RotateCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserCheck className="h-3.5 w-3.5" />
              )}
              Claim Case
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
              <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>
                Assigned:{" "}
                <strong className="font-semibold text-slate-900">
                  {data.caseDossier.officerAssignedName || "Active Officer"}
                </strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Explainable Case Status Standard Bar */}
      <div className="grid grid-cols-1 gap-2 border-t border-slate-100 pt-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500">Stage:</span>
          <Badge variant="outline" className="font-medium">
            {data.caseDossier.currentStage.replace(/_/g, " ")}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500">State:</span>
          <Badge
            variant={
              data.caseDossier.currentState === "ACTION_REQUIRED"
                ? "destructive"
                : data.caseDossier.currentState === "COMPLETED"
                  ? "success"
                  : "secondary"
            }
          >
            {data.caseDossier.currentState}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500">Responsible:</span>
          <span className="font-medium text-slate-800">{data.caseDossier.responsibleActor}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-500">Next Action:</span>
          <span className="truncate text-slate-700" title={data.caseDossier.nextAction}>
            {data.caseDossier.nextAction}
          </span>
        </div>
      </div>

      {data.caseDossier.blocker && (
        <div className="flex items-center gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
          <span>
            <strong>Blocker:</strong> {data.caseDossier.blocker}
          </span>
        </div>
      )}
    </div>
  );
}
