"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { LogIn, LogOut, User as UserIcon, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function SessionNavUser() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2">
        <div className="h-7 w-24 animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <Link href="/login">
        <Button
          variant="default"
          size="sm"
          className="gap-1.5 bg-gov-saffron text-xs text-white hover:bg-amber-600"
        >
          <LogIn className="h-3.5 w-3.5" />
          <span>Sign In</span>
        </Button>
      </Link>
    );
  }

  const user = session.user;
  const roleColors: Record<string, string> = {
    APPLICANT: "bg-blue-100 text-blue-800 border-blue-200",
    VERIFICATION_OFFICER: "bg-emerald-100 text-emerald-800 border-emerald-200",
    SCHEME_ADMIN: "bg-purple-100 text-purple-800 border-purple-200",
    OPERATIONS_DIRECTOR: "bg-amber-100 text-amber-800 border-amber-200",
  };

  return (
    <div className="flex items-center gap-2.5">
      <div className="shadow-xs flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs">
        <UserIcon className="h-3.5 w-3.5 text-slate-500" />
        <span className="max-w-[140px] truncate font-medium text-slate-800">
          {user.name || user.email}
        </span>
        <Badge
          variant="outline"
          className={`px-1.5 py-0 font-mono text-[10px] uppercase ${roleColors[user.role] || "bg-slate-100"}`}
        >
          {user.role}
        </Badge>
        {user.isDemoSession && (
          <span className="inline-flex items-center rounded-sm bg-slate-100 px-1 text-[9px] font-semibold text-slate-500">
            DEMO
          </span>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="h-8 gap-1 px-2 text-xs text-slate-600 hover:bg-rose-50 hover:text-rose-700"
        title="Sign Out"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Logout</span>
      </Button>
    </div>
  );
}
