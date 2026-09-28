"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeficiencyFrictionItemDTO } from "@/server/domain/operations/types";
import { DeficiencyType, DocumentType } from "@prisma/client";
import { TrendingUp, ArrowRight, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";

interface DeficiencyHeatmapCardProps {
  deficiencyHeatmap: DeficiencyFrictionItemDTO[];
  onInspectDeficiency: (item: DeficiencyFrictionItemDTO) => void;
}

export function DeficiencyHeatmapCard({
  deficiencyHeatmap,
  onInspectDeficiency,
}: DeficiencyHeatmapCardProps) {
  return (
    <Card className="border-slate-200" data-testid="deficiency-heatmap-card">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gov-slate" />
            <CardTitle className="text-sm font-bold text-slate-900">
              Recurring Deficiency Intelligence &amp; Friction Matrix
            </CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs font-semibold">
            {deficiencyHeatmap.reduce((acc, d) => acc + d.openCount, 0)} Open Exceptions
          </Badge>
        </div>
        <CardDescription className="text-xs text-slate-500">
          Counts of recorded open and resolved deficiencies by configured scheme and document type.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {deficiencyHeatmap.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-500" />
            <span className="text-sm font-bold text-slate-800">No Active Deficiencies</span>
            <span className="mt-1 text-xs text-slate-500">
              No deficiency records match the selected filters.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Scheme</th>
                  <th className="px-4 py-2.5">Deficiency Type</th>
                  <th className="px-4 py-2.5">Target Document</th>
                  <th className="px-4 py-2.5 text-center">Open</th>
                  <th className="px-4 py-2.5 text-center">Resolved</th>
                  <th className="px-4 py-2.5 text-center">Cases affected</th>
                  <th className="px-4 py-2.5 text-center">Recheck Fail Share</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deficiencyHeatmap.map((item) => (
                  <tr
                    key={`${item.schemeCode}__${item.deficiencyType}__${item.documentType}`}
                    className="transition-colors hover:bg-slate-50/80"
                    data-testid={`deficiency-row-${item.schemeCode}-${item.deficiencyType}`}
                  >
                    <td className="px-4 py-3 text-slate-600">{item.schemeCode}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                        <span>{item.deficiencyType.replace(/_/g, " ")}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3 w-3 text-slate-400" />
                        <span>{item.documentType.replace(/_/g, " ")}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                        {item.openCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500">{item.resolvedCount}</td>
                    <td className="px-4 py-3 text-center text-slate-500">
                      {item.affectedCaseCount}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-slate-600">
                        {item.recheckFailureRate}% of {item.recheckCount} rechecks
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-[11px] text-slate-700 hover:text-gov-slate"
                        onClick={() => onInspectDeficiency(item)}
                        data-testid={`inspect-deficiency-${item.deficiencyType}`}
                      >
                        <span>Inspect Cases</span>
                        <ArrowRight className="ml-1 h-2.5 w-2.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
