"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StageWorkloadItemDTO } from "@/server/domain/operations/types";
import { CaseStage } from "@prisma/client";
import { Layers, ArrowRight, Clock, AlertCircle } from "lucide-react";

interface StageDistributionCardProps {
  stageDistribution: StageWorkloadItemDTO[];
  onInspectStage: (stage: CaseStage) => void;
}

export function StageDistributionCard({
  stageDistribution,
  onInspectStage,
}: StageDistributionCardProps) {
  return (
    <Card className="border-slate-200" data-testid="stage-distribution-card">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-gov-slate" />
            <CardTitle className="text-sm font-bold text-slate-900">
              Stage Pipeline Flow &amp; Workload Distribution
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-xs font-semibold">
            {stageDistribution.reduce((acc, s) => acc + s.totalCases, 0)} Total Cases
          </Badge>
        </div>
        <CardDescription className="text-xs text-slate-500">
          Current database snapshot by lifecycle stage. Percentages are of active cases only.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {stageDistribution.map((item) => (
            <div
              key={item.stage}
              className="flex flex-col gap-3 p-4 transition-colors hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between"
              data-testid={`stage-row-${item.stage}`}
            >
              {/* Left: Stage Title & Dwell */}
              <div className="space-y-1 sm:w-1/3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{item.stageLabel}</span>
                  {item.blockedCount > 0 && (
                    <Badge variant="destructive" className="px-1.5 py-0 text-[10px] font-bold">
                      {item.blockedCount} Blocked
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    Avg Dwell: <strong>{item.avgDwellDays}d</strong>
                  </span>
                  <span className="text-slate-300">&bull;</span>
                  <span>{item.percentageOfActive}% of Active</span>
                </div>
              </div>

              {/* Middle: Workload Breakdown Tags */}
              <div className="flex flex-wrap items-center gap-1.5 sm:w-1/3">
                {item.pendingCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="border border-amber-200 bg-amber-50 text-[11px] text-amber-700"
                  >
                    {item.pendingCount} Pending
                  </Badge>
                )}
                {item.inReviewCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="border border-blue-200 bg-blue-50 text-[11px] text-blue-700"
                  >
                    {item.inReviewCount} In Review
                  </Badge>
                )}
                {item.approvedCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="border border-emerald-200 bg-emerald-50 text-[11px] text-emerald-700"
                  >
                    {item.approvedCount} Approved
                  </Badge>
                )}
                {item.rejectedCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="border border-rose-200 bg-rose-50 text-[11px] text-rose-700"
                  >
                    {item.rejectedCount} Rejected
                  </Badge>
                )}
                {item.totalCases === 0 && (
                  <span className="text-xs italic text-slate-400">No active cases</span>
                )}
              </div>

              {/* Right: Total & Action */}
              <div className="flex items-center justify-between gap-3 sm:w-1/3 sm:justify-end">
                <div className="text-right">
                  <span className="text-base font-black text-slate-900">{item.totalCases}</span>
                  <span className="ml-1 text-xs text-slate-400">cases</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs text-slate-700 hover:text-gov-slate"
                  onClick={() => onInspectStage(item.stage)}
                  disabled={item.totalCases === 0}
                  data-testid={`inspect-stage-${item.stage}`}
                >
                  <span>Inspect</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
