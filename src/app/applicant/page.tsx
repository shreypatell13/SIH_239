import { User, FileText, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getServerAuthUser } from "@/server/auth/session";

export default async function ApplicantPortalPage() {
  const user = await getServerAuthUser();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Applicant Portal</h1>
            <Badge variant="outline">Role: APPLICANT</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Self-service scholarship journey for Scheduled Tribe candidates.
          </p>
        </div>
        <Badge variant="success">
          {user ? `Active User: ${user.name}` : "Active Demo Persona: Ramesh Kumar Meena"}
        </Badge>
      </div>

      {/* Explainable Case Status Foundation Card */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-base text-amber-900">
                Explainable Case Status Model
              </CardTitle>
            </div>
            <Badge variant="warning">Action Required</Badge>
          </div>
          <CardDescription className="text-xs text-amber-700">
            Standard: No opaque &ldquo;Rejected&rdquo; labels. Transparent stage, blocker,
            responsible actor, and next remedy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-800">
          <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
            <div>
              <strong>Stage:</strong> Document Verification
            </div>
            <div>
              <strong>Responsible Actor:</strong> Applicant (You)
            </div>
            <div>
              <strong>Blocker:</strong> Income Certificate issue date exceeds FY 2025-26 cutoff
            </div>
            <div>
              <strong>Next Action:</strong> Upload renewed Income Certificate before 15-Oct-2026
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gov-slate" />
              <CardTitle className="text-base">NFST — National Fellowship for ST</CardTitle>
            </div>
            <CardDescription className="text-xs">
              M.Phil / Ph.D. Higher Education in Indian Universities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs text-slate-600">
            <div>&bull; ST Category Confirmation Required</div>
            <div>&bull; Qualifying Entrance: UGC/CSIR-NET or equivalent</div>
            <div>&bull; Readiness Checklist: 0/3 items uploaded (Foundation Mode)</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gov-slate" />
              <CardTitle className="text-base">NOS — National Overseas Scholarship</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Masters / Ph.D. Courses in Top Ranked Foreign Universities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs text-slate-600">
            <div>&bull; Annual Family Income Ceiling: &le; &#8377;8,00,000</div>
            <div>&bull; Valid Passport &amp; Unconditional Foreign Offer Letter</div>
            <div>&bull; Minimum Academic Score: &ge; 60%</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
