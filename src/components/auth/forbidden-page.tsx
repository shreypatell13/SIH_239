import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
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
import { UserRole } from "@/server/auth/roles";

interface ForbiddenPageProps {
  requiredRole: UserRole;
  actualRole?: UserRole;
  resourceTitle?: string;
}

export function ForbiddenPage({
  requiredRole,
  actualRole,
  resourceTitle = "Authorized Portal Area",
}: ForbiddenPageProps) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center py-12">
      <Card className="w-full border-rose-200 shadow-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <Badge variant="destructive" className="mx-auto mb-2">
            HTTP 403 Forbidden
          </Badge>
          <CardTitle className="text-xl font-bold text-slate-900">Access Restricted</CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Your current authenticated account does not hold the authorization required to access{" "}
            <span className="font-semibold text-slate-800">{resourceTitle}</span>.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 rounded-lg bg-slate-50 p-4 text-xs text-slate-700">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">Required Role:</span>
            <Badge variant="outline" className="font-mono font-semibold">
              {requiredRole}
            </Badge>
          </div>
          {actualRole && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Your Active Role:</span>
              <Badge variant="secondary" className="font-mono">
                {actualRole}
              </Badge>
            </div>
          )}
          <p className="text-slate-500">
            Server-side Role-Based Access Control (RBAC) enforced. If you believe this is an error,
            please log in with an authorized account or contact the scheme administrator.
          </p>
        </CardContent>

        <CardFooter className="flex gap-3 pt-4">
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full gap-2">
              <Home className="h-4 w-4" />
              <span>Return Home</span>
            </Button>
          </Link>
          <Link href="/login" className="flex-1">
            <Button variant="default" className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Switch Account</span>
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
