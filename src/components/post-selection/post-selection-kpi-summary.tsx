"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle2, Clock, AlertTriangle, ShieldCheck, IndianRupee } from "lucide-react";
import { PostSelectionMetricsDTO } from "@/server/domain/post-selection/types";

interface PostSelectionKpiSummaryProps {
  metrics: PostSelectionMetricsDTO | null;
  isLoading?: boolean;
}

export function PostSelectionKpiSummary({ metrics, isLoading }: PostSelectionKpiSummaryProps) {
  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse bg-slate-50">
            <CardContent className="p-4">
              <div className="h-4 w-20 rounded bg-slate-200"></div>
              <div className="mt-2 h-7 w-12 rounded bg-slate-300"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      title: "Total Scholars",
      value: metrics.totalScholars,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      subtitle: `${metrics.completedScholars} completed`,
    },
    {
      title: "Active Scholars",
      value: metrics.activeScholars,
      icon: ShieldCheck,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      subtitle: `${metrics.onHoldScholars} on hold`,
    },
    {
      title: "Renewals Due",
      value: metrics.renewalsDue,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      subtitle: "Upcoming annual cycles",
    },
    {
      title: "Under Review",
      value: metrics.renewalsUnderReview,
      icon: Clock,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      subtitle: "Officer review queue",
    },
    {
      title: "Deficiencies",
      value: metrics.deficientRenewals,
      icon: AlertTriangle,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      subtitle: "Action required",
    },
    {
      title: "Total Disbursed",
      value: `₹${(metrics.totalDisbursedAmount / 100000).toFixed(1)}L`,
      icon: IndianRupee,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      subtitle: `₹${(metrics.pendingDisbursementAmount / 100000).toFixed(1)}L pending`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <Card
            key={idx}
            className="transition-hover border-slate-200 shadow-sm hover:shadow-md"
            data-testid={`kpi-card-${idx}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{kpi.title}</span>
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-md ${kpi.bgColor}`}
                >
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {kpi.value}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">{kpi.subtitle}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
