"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { KpiSummaryDTO } from "@/server/domain/operations/types";

interface KpiSummaryCardsProps {
  kpis: KpiSummaryDTO;
  onFilterClick?: (type: string) => void;
}

export function KpiSummaryCards({ kpis, onFilterClick }: KpiSummaryCardsProps) {
  const cards = [
    {
      label: "Total Cases",
      value: kpis.totalIngestedCases,
      action: "ALL_CASES",
      detail: `${kpis.activePipelineCases} active`,
    },
    {
      label: "Pending",
      value: kpis.pendingCases,
      action: "PENDING",
      detail: "Active cases in PENDING state",
    },
    {
      label: "Under Verification",
      value: kpis.underVerificationCases,
      action: "VERIFICATION",
      detail: "Automated verification or officer review",
    },
    {
      label: "Cases with Open Deficiencies",
      value: kpis.deficientCases,
      action: "DEFICIENCIES",
      detail: `${kpis.unresolvedDeficienciesCount} open deficiency records`,
    },
    {
      label: "Awaiting Applicant",
      value: kpis.awaitingApplicantCases,
      action: "AWAITING_APPLICANT",
      detail: "Current state: ACTION_REQUIRED",
    },
    {
      label: "Completed / Closed",
      value: kpis.completedCases,
      action: "COMPLETED",
      detail: `${kpis.closedCasePercentage}% of total cases closed`,
    },
    {
      label: "Officer Attention",
      value: kpis.officerAttentionCases,
      action: "OFFICER_ATTENTION",
      detail: `${kpis.unassignedOfficerQueueCount} unassigned in review`,
    },
    {
      label: "Average Active Case Age",
      value: `${kpis.avgActiveCaseAgeDays} d`,
      detail: "Mean age from case creation",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.label}
          className={`${card.action ? "cursor-pointer" : ""} border-slate-200 transition hover:border-gov-slate/40 hover:shadow-sm`}
          onClick={card.action ? () => onFilterClick?.(card.action!) : undefined}
          data-testid={`kpi-card-${(card.action || card.label).toLowerCase().replaceAll("_", "-").replaceAll(" ", "-")}`}
        >
          <CardHeader className="pb-1">
            <CardDescription className="text-xs font-semibold text-slate-500">
              {card.label}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-gov-slate">{card.value}</div>
            <p className="mt-1 text-xs text-slate-500">{card.detail}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
