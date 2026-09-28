"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  OfficerWorkloadItemDTO,
  SchemeOperationsSummaryDTO,
} from "@/server/domain/operations/types";

interface OperationsBreakdownCardProps {
  officerWorkload: OfficerWorkloadItemDTO[];
  schemeSummary: SchemeOperationsSummaryDTO[];
  onInspectOfficer: (officerId: string, officerName: string) => void;
  onInspectScheme: (schemeCode: string) => void;
}

export function OperationsBreakdownCard({
  officerWorkload,
  schemeSummary,
  onInspectOfficer,
  onInspectScheme,
}: OperationsBreakdownCardProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="border-slate-200" data-testid="officer-workload-card">
        <CardHeader>
          <CardTitle className="text-sm">Officer Workload</CardTitle>
          <CardDescription>
            Assigned, open, and completed case counts. No performance ranking.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2">Officer</th>
                <th className="px-3 py-2">Assigned</th>
                <th className="px-3 py-2">Open</th>
                <th className="px-3 py-2">Completed</th>
                <th className="px-3 py-2">Oldest open age</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {officerWorkload.map((item) => (
                <tr key={item.officerId}>
                  <td className="px-4 py-2 font-medium">{item.officerName}</td>
                  <td className="px-3 py-2">{item.assignedCases}</td>
                  <td className="px-3 py-2">{item.openCases}</td>
                  <td className="px-3 py-2">{item.completedCases}</td>
                  <td className="px-3 py-2">
                    {item.oldestOpenCaseAgeDays === null
                      ? "—"
                      : `${item.oldestOpenCaseAgeDays.toFixed(1)} d`}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onInspectOfficer(item.officerId, item.officerName)}
                    >
                      Cases
                    </Button>
                  </td>
                </tr>
              ))}
              {officerWorkload.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">
                    No assigned cases in this scope.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-slate-200" data-testid="scheme-operations-card">
        <CardHeader>
          <CardTitle className="text-sm">Scheme Operations</CardTitle>
          <CardDescription>
            Generic per-scheme case counts and active case age from current database records.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2">Scheme</th>
                <th className="px-3 py-2">Cases</th>
                <th className="px-3 py-2">Active</th>
                <th className="px-3 py-2">Deficient</th>
                <th className="px-3 py-2">Avg active age</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schemeSummary.map((item) => (
                <tr key={item.schemeCode}>
                  <td className="px-4 py-2 font-medium">{item.schemeName}</td>
                  <td className="px-3 py-2">{item.totalCases}</td>
                  <td className="px-3 py-2">{item.activeCases}</td>
                  <td className="px-3 py-2">{item.deficientCases}</td>
                  <td className="px-3 py-2">{item.averageActiveAgeDays.toFixed(1)} d</td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onInspectScheme(item.schemeCode)}
                    >
                      Cases
                    </Button>
                  </td>
                </tr>
              ))}
              {schemeSummary.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-500">
                    No cases found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
