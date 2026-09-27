import Link from "next/link";
import { User, ShieldCheck, Settings, Activity, ArrowRight, CheckCircle2 } from "lucide-react";
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

export default function HomePage() {
  const roles = [
    {
      title: "Applicant Portal",
      role: "APPLICANT",
      description:
        "Explore NFST & NOS schemes, complete pre-flight readiness checks, submit documents, and resolve deficiencies.",
      href: "/applicant",
      icon: User,
      badge: "Self-Service",
      features: ["Dynamic Form Engine", "Pre-Flight Checklist", "Deficiency Remediation"],
    },
    {
      title: "Officer Case Workspace",
      role: "VERIFICATION_OFFICER",
      description:
        "Triage scholarship dossiers, inspect split-screen visual evidence bounding boxes, and adjudicate with audit remarks.",
      href: "/officer",
      icon: ShieldCheck,
      badge: "Human-in-the-Loop",
      features: ["Split-Screen Evidence", "Cross-Doc Consistency", "Structured Deficiencies"],
    },
    {
      title: "Scheme Studio",
      role: "SCHEME_ADMIN",
      description:
        "Declaratively configure scheme policies, eligibility thresholds, required document matrices, and workflow SLAs.",
      href: "/admin",
      icon: Settings,
      badge: "Configurable Policy",
      features: ["NFST & NOS Configs", "Dynamic Schema Builder", "Policy Versioning"],
    },
    {
      title: "Operations Control Tower",
      role: "OPERATIONS_DIRECTOR",
      description:
        "Monitor scheme health, identify application processing bottlenecks, track officer workload, and analyze recurring defects.",
      href: "/management",
      icon: Activity,
      badge: "Observability",
      features: ["Executive KPIs", "Funnel Bottleneck Analytics", "Recurring Defect Heatmap"],
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Hero Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="bg-gov-saffron text-white">
                SIH Problem Statement 26239
              </Badge>
              <Badge variant="success">Phase 2A Foundation Active</Badge>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              TribalScholar AI
            </h2>
            <p className="max-w-2xl text-base text-slate-600">
              Configurable, Evidence-Aware, Exception-Driven Scholarship Case Orchestration platform
              for Scheduled Tribes across India.
            </p>
          </div>
          <div className="w-full space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs md:w-auto">
            <div className="font-semibold text-slate-700">Engineering Foundation:</div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Next.js 14 App Router (Strict TS)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Prisma ORM + PostgreSQL</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Vitest Unit & Integration Runner</span>
            </div>
          </div>
        </div>
      </div>

      {/* Role Navigation Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {roles.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.href}
              className="flex flex-col justify-between shadow-sm transition-all hover:border-slate-300"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-gov-slate">
                    <Icon className="h-5 w-5 text-gov-slate" />
                  </div>
                  <Badge variant="secondary">{item.badge}</Badge>
                </div>
                <CardTitle className="mt-3 text-xl">{item.title}</CardTitle>
                <CardDescription className="text-sm">{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-xs text-slate-600">
                  {item.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-gov-saffron" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="border-t border-slate-100 pt-4">
                <Link href={item.href} className="w-full">
                  <Button variant="default" className="flex w-full items-center justify-between">
                    <span>Enter {item.title}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
