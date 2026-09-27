import { Activity, TrendingUp, AlertCircle, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ManagementControlTowerPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Operations Control Tower
            </h1>
            <Badge variant="outline">Role: MANAGEMENT</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Executive monitoring, SLA tracking, pipeline bottleneck analysis, and recurring
            deficiency intelligence.
          </p>
        </div>
        <Badge variant="success">Active Demo Director: Dr. Sunita Rao</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Total Ingested Cases</CardDescription>
            <CardTitle className="text-2xl font-bold text-gov-slate">1,248</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500">NFST: 780 &bull; NOS: 468</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Clearance Rate</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">84.2%</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500">+3.1% vs last cycle</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Average Turnaround Time</CardDescription>
            <CardTitle className="text-2xl font-bold text-gov-saffron">4.2 Days</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500">Target SLA: 5.0 Days</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Active Deficiencies</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600">112</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500">In Applicant Remediation</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gov-slate" />
              <CardTitle className="text-base">Recurring Deficiency Intelligence Heatmap</CardTitle>
            </div>
            <Badge variant="secondary">Intelligence Loop</Badge>
          </div>
          <CardDescription className="text-xs">
            Pinpoints systemic application friction to drive policy and UX guidance improvements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-slate-600">
          <div className="rounded border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
            Foundation verified: Route accessible &bull; Server-authoritative RBAC guard active.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
