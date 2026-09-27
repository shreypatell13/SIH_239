import { ShieldCheck, Eye, ListFilter } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function OfficerWorkspacePage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Officer Case Workspace
            </h1>
            <Badge variant="outline">Role: OFFICER</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Split-screen verification, evidence inspection, and human-in-the-loop decision desk.
          </p>
        </div>
        <Badge variant="success">Active Demo Officer: Priya Sharma</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Assigned Cases</CardDescription>
            <CardTitle className="text-2xl font-bold text-gov-slate">14</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500">
            Priority Queue &bull; 3 High SLA Risk
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Deficiencies Resubmitted</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600">5</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500">Ready for Targeted Recheck</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Adjudicated Today</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">8</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500">Immutable Audit Trail Logged</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-gov-slate" />
              <CardTitle className="text-base">Split-Screen Workspace Architecture</CardTitle>
            </div>
            <Badge variant="secondary">Phase 2I Target</Badge>
          </div>
          <CardDescription className="text-xs">
            Left pane: Applicant demographic fields &amp; rule findings &bull; Right pane: High-res
            PDF viewer with visual evidence bounding boxes.
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
