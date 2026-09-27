"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, User, Users, Settings, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function NavShell() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/applicant", label: "Applicant Portal", icon: User, role: "APPLICANT" },
    {
      href: "/officer",
      label: "Officer Workspace",
      icon: ShieldCheck,
      role: "VERIFICATION_OFFICER",
    },
    { href: "/admin", label: "Scheme Studio", icon: Settings, role: "SCHEME_ADMIN" },
    { href: "/management", label: "Control Tower", icon: Activity, role: "OPERATIONS_DIRECTOR" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      {/* Top Gov Bar */}
      <div className="bg-gov-navy px-4 py-1.5 text-xs text-slate-200">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-semibold tracking-wider text-amber-400">SIH 26239</span>
            <span>|</span>
            <span>Ministry of Tribal Affairs — Scholarship & Fellowship Orchestration</span>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="border-amber-400/40 text-amber-300">
              Phase 2A Foundation
            </Badge>
            <span className="text-slate-400">Demo Persona Active</span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gov-slate text-white shadow">
            <ShieldCheck className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">TribalScholar AI</h1>
            <p className="text-xs text-slate-500">Case-Centric Scholarship Management</p>
          </div>
        </Link>

        {/* Role Portals */}
        <nav className="hidden items-center space-x-1 md:flex">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-100 font-semibold text-gov-slate"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-gov-saffron" : "text-slate-400"}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* System Health Link */}
        <div className="flex items-center space-x-2">
          <Link
            href="/api/health"
            target="_blank"
            className="flex items-center space-x-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span>API Health</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
