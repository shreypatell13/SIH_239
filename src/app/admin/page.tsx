import Link from "next/link";
import { Sliders, Layers, Settings2, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getServerAuthUser } from "@/server/auth/session";
import { schemeService } from "@/server/services/scheme.service";

export default async function AdminSchemeStudioPage() {
  const user = await getServerAuthUser();
  const schemes = user ? await schemeService.listAllSchemes(user) : [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Scheme Studio — Administrator Console
            </h1>
            <Badge variant="outline">Role: SCHEME_ADMIN</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Declarative scheme authoring, versioning, document matrices, eligibility rules, and SLA
            workflows.
          </p>
        </div>
        <Badge variant="success">
          {user ? `Active Admin: ${user.name}` : "Active Demo Admin: Rajesh Verma"}
        </Badge>
      </div>

      {/* Main Scheme Studio CTA Banner */}
      <Card className="border-gov-slate/20 bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-gov-saffron" />
              <CardTitle className="text-lg text-white">
                Declarative Scheme Studio Workspace
              </CardTitle>
            </div>
            <Badge className="bg-emerald-600 text-[10px] text-white hover:bg-emerald-700">
              Phase 2D Engine Active
            </Badge>
          </div>
          <CardDescription className="text-xs text-slate-300">
            Create, configure, test, and publish scholarship and fellowship policies with zero
            hardcoded code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-slate-300">
          <p>
            Supports NFST, NOS, and custom tribal scholarship programs on a single shared
            orchestrator engine with atomic versioning and immutability guarantees.
          </p>
          <div className="flex flex-wrap gap-4 pt-2 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>{schemes.length} Schemes Configured</span>
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Atomic Version Supersession</span>
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Declarative Rules DSL</span>
            </span>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t border-slate-700/60 pt-2">
          <span className="text-[11px] text-slate-400">Authorized for SCHEME_ADMIN role only</span>
          <Link href="/admin/schemes">
            <Button
              size="sm"
              className="gap-2 bg-gov-saffron font-bold text-slate-900 hover:bg-amber-600"
            >
              <span>Open Scheme Studio</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>

      {/* Scheme Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="shadow-xs border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-gov-slate" />
                <CardTitle className="text-base">Declarative Policy Engine</CardTitle>
              </div>
              <Badge variant="success">Active Engine</Badge>
            </div>
            <CardDescription className="text-xs">
              JSON schema driven dynamic fields and eligibility parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-slate-600">
            <div>&bull; Configurable without writing code or redeploying backend</div>
            <div>&bull; Dynamic field types: Text, Number, Date, Select, Boolean, Textarea</div>
            <div>
              &bull; Version immutability ensures active cases retain original policy snapshot
            </div>
          </CardContent>
          <CardFooter className="border-t border-slate-100 pt-2">
            <Link
              href="/admin/schemes"
              className="flex items-center gap-1 text-xs font-semibold text-gov-slate hover:underline"
            >
              <span>Manage form schemas &amp; rules</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardFooter>
        </Card>

        <Card className="shadow-xs border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-gov-slate" />
                <CardTitle className="text-base">Document Requirement Matrix</CardTitle>
              </div>
              <Badge variant="secondary">Matrix Engine</Badge>
            </div>
            <CardDescription className="text-xs">
              Mandatory, conditional, and optional certificate definitions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-slate-600">
            <div>&bull; Allowed MIME types: PDF, JPEG, PNG with size constraints</div>
            <div>&bull; Validity rules: e.g. 12-month income certificate freshness</div>
            <div>&bull; Governs Phase 2F extraction pipeline and Phase 2G verification engine</div>
          </CardContent>
          <CardFooter className="border-t border-slate-100 pt-2">
            <Link
              href="/admin/schemes"
              className="flex items-center gap-1 text-xs font-semibold text-gov-slate hover:underline"
            >
              <span>Inspect document requirements</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
