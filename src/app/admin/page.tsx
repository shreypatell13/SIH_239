import { Settings, Sliders, Layers } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminSchemeStudioPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Scheme Studio</h1>
            <Badge variant="outline">Role: ADMIN</Badge>
          </div>
          <p className="text-sm text-slate-500">
            Declarative scheme authoring, versioning, document requirements, and deterministic rules
            configuration.
          </p>
        </div>
        <Badge variant="success">Active Demo Admin: Rajesh Verma</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-gov-slate" />
                <CardTitle className="text-base">Declarative Policy Engine</CardTitle>
              </div>
              <Badge variant="success">Active (v2025.1)</Badge>
            </div>
            <CardDescription className="text-xs">
              JSON schema driven dynamic fields and eligibility parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-slate-600">
            <div>&bull; Configurable without writing code or redeploying backend</div>
            <div>&bull; Dynamic field types: Text, Number, Date, File, Select, Radio</div>
            <div>
              &bull; Version immutability ensures active cases retain original policy snapshot
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-gov-slate" />
                <CardTitle className="text-base">Document Requirement Matrix</CardTitle>
              </div>
              <Badge variant="secondary">Matrix Editor</Badge>
            </div>
            <CardDescription className="text-xs">
              Mandatory, conditional, and optional proof definitions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-slate-600">
            <div>&bull; Allowed extensions: .pdf, .jpg, .png</div>
            <div>&bull; Max file size: 5 MB</div>
            <div>
              &bull; Expiry validation: Income certificates require current financial year validity
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
