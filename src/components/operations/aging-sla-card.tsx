"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AgingBucket, AgingBucketItemDTO } from "@/server/domain/operations/types";
import { Clock, ArrowRight } from "lucide-react";

interface AgingSlaCardProps {
  agingDistribution: AgingBucketItemDTO[];
  onInspectAging: (bucket: AgingBucket) => void;
}

export function AgingSlaCard({ agingDistribution, onInspectAging }: AgingSlaCardProps) {
  const getBucketColor = (bucket: AgingBucket) => {
    switch (bucket) {
      case "DAYS_0_TO_2":
        return "bg-emerald-500";
      case "DAYS_3_TO_7":
        return "bg-amber-500";
      case "DAYS_8_TO_14":
        return "bg-orange-500";
      case "DAYS_15_PLUS":
        return "bg-rose-500";
    }
  };

  return (
    <Card className="border-slate-200" data-testid="aging-sla-card">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gov-slate" />
            <CardTitle className="text-sm font-bold text-slate-900">
              Active Pipeline Aging &amp; Dwell Distribution
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-xs font-semibold">
            4 Aging Cohorts
          </Badge>
        </div>
        <CardDescription className="text-xs text-slate-500">
          Analytical age bands from case creation time; these are not official SLA thresholds.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        {agingDistribution.map((item) => (
          <div
            key={item.bucket}
            className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:bg-slate-50"
            data-testid={`aging-bucket-${item.bucket}`}
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">{item.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-black text-slate-900">{item.count} cases</span>
                <span className="text-slate-400">({item.percentageOfActive}%)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[11px] text-gov-slate hover:bg-slate-200"
                  onClick={() => onInspectAging(item.bucket)}
                  disabled={item.count === 0}
                  data-testid={`inspect-aging-${item.bucket}`}
                >
                  <span>Cases</span>
                  <ArrowRight className="ml-1 h-2.5 w-2.5" />
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full transition-all ${getBucketColor(item.bucket)}`}
                style={{
                  width: `${Math.min(100, Math.max(item.count > 0 ? 5 : 0, item.percentageOfActive))}%`,
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
