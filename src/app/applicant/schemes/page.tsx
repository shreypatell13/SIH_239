import React from "react";
import Link from "next/link";
import { schemeService } from "@/server/services/scheme.service";
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
import { Building2, Calendar, FileText, ArrowRight, ArrowLeft } from "lucide-react";

export default async function ApplicantSchemesPage() {
  const schemes = await schemeService.listActiveSchemes().catch(() => []);

  return (
    <div className="mx-auto max-w-5xl space-y-8" data-testid="applicant-schemes-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/applicant">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Scholarship Scheme Explorer</h1>
            <p className="text-xs text-slate-500">
              Explore national fellowship and overseas scholarship schemes for Scheduled Tribe
              candidates.
            </p>
          </div>
        </div>
      </div>

      {/* Scheme Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {schemes.map((scheme) => (
          <Card
            key={scheme.id}
            className="flex flex-col justify-between border-slate-200 transition-shadow hover:shadow-md"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-xs font-bold text-gov-navy">
                  {scheme.code}
                </Badge>
                <Badge variant="success">Active Scheme Window</Badge>
              </div>

              <CardTitle className="mt-3 text-lg text-slate-900">{scheme.name}</CardTitle>
              <CardDescription className="line-clamp-3 text-xs text-slate-600">
                {scheme.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2 text-slate-500">
                <Building2 className="h-4 w-4 text-gov-slate" />
                <span>{scheme.ministry}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Calendar className="h-4 w-4 text-gov-slate" />
                <span>
                  {scheme.applicationDeadline
                    ? `Application Deadline: ${new Date(scheme.applicationDeadline).toLocaleDateString("en-IN")}`
                    : "Continuous Open Application Window"}
                </span>
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="font-mono text-xs text-slate-400">
                Version {scheme.activeVersionNumber || 1} Active
              </span>

              <Link href={`/applicant/schemes/${scheme.code}`}>
                <Button
                  size="sm"
                  className="flex items-center gap-1.5 bg-gov-navy text-xs text-white hover:bg-gov-navy/90"
                >
                  Check Eligibility &amp; Apply
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}

        {schemes.length === 0 && (
          <div className="col-span-2 rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No active scholarship schemes are currently open for applications.
          </div>
        )}
      </div>
    </div>
  );
}
