"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BottleneckItemDTO } from "@/server/domain/operations/types";
import { AlertOctagon, AlertTriangle, Info, ArrowRight, CheckCircle } from "lucide-react";

interface BottleneckAlertsCardProps {
  bottlenecks: BottleneckItemDTO[];
  onInspectBottleneck: (item: BottleneckItemDTO) => void;
}

export function BottleneckAlertsCard({
  bottlenecks,
  onInspectBottleneck,
}: BottleneckAlertsCardProps) {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return (
          <Badge variant="destructive" className="bg-rose-600 text-[10px] font-bold uppercase">
            Critical
          </Badge>
        );
      case "HIGH":
        return (
          <Badge
            variant="secondary"
            className="border-amber-300 bg-amber-100 text-[10px] font-bold uppercase text-amber-800"
          >
            High Priority
          </Badge>
        );
      case "MEDIUM":
        return (
          <Badge
            variant="secondary"
            className="border-blue-300 bg-blue-100 text-[10px] font-semibold uppercase text-blue-800"
          >
            Medium
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] text-slate-600">
            Notice
          </Badge>
        );
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <AlertOctagon className="h-4 w-4 shrink-0 text-rose-600" />;
      case "HIGH":
        return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />;
      default:
        return <Info className="h-4 w-4 shrink-0 text-blue-600" />;
    }
  };

  return (
    <Card className="border-slate-200" data-testid="bottleneck-alerts-card">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="h-4 w-4 text-rose-600" />
            <CardTitle className="text-sm font-bold text-slate-900">
              Explainable Operational Bottlenecks
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-xs font-semibold">
            {bottlenecks.length} Active {bottlenecks.length === 1 ? "Alert" : "Alerts"}
          </Badge>
        </div>
        <CardDescription className="text-xs text-slate-500">
          Deterministic indicators based on current volume, age, deficiency concentration, and
          unassigned workload. Comparison thresholds are analytical triggers, not official SLAs.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {bottlenecks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <CheckCircle className="mb-2 h-8 w-8 text-emerald-500" />
            <span className="text-sm font-bold text-slate-800">Pipeline Operating Smoothly</span>
            <span className="mt-1 text-xs text-slate-500">
              No configured volume, aging, deficiency-concentration, or unassigned-queue triggers
              detected.
            </span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {bottlenecks.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 p-4 transition-colors hover:bg-slate-50/80 sm:flex-row sm:items-start sm:justify-between"
                data-testid={`bottleneck-item-${item.id}`}
              >
                <div className="flex items-start gap-3 sm:w-3/4">
                  <div className="mt-0.5">{getSeverityIcon(item.severity)}</div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{item.title}</span>
                      {getSeverityBadge(item.severity)}
                      <Badge variant="outline" className="text-[10px] text-slate-500">
                        {item.caseCount} Affected Cases
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600">{item.explanation}</p>
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                      <span>
                        Measured:{" "}
                        <strong className="text-slate-700">
                          {item.metricValue} {item.unit}
                        </strong>
                      </span>
                      <span>&bull;</span>
                      <span>
                        Analytical trigger:{" "}
                        <strong className="text-slate-700">
                          &lt; {item.thresholdValue} {item.unit}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end sm:w-1/4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 text-xs text-slate-700 hover:text-gov-slate"
                    onClick={() => onInspectBottleneck(item)}
                    data-testid={`inspect-bottleneck-${item.id}`}
                  >
                    <span>View Cases</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
