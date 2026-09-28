"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, AlertCircle, Loader2, Settings } from "lucide-react";

export default function CreateSchemePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ministry, setMinistry] = useState("Ministry of Tribal Affairs");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/schemes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim(),
          ministry: ministry.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to create scheme");
        setIsLoading(false);
        return;
      }

      router.push(`/admin/schemes/${data.scheme.id}`);
      router.refresh();
    } catch {
      setErrorMessage("An unexpected network error occurred.");
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/schemes">
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Scheme Studio</span>
          </Button>
        </Link>
      </div>

      <Card className="shadow-xs border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-[11px]">
              Scheme Studio
            </Badge>
            <Settings className="h-4 w-4 text-slate-400" />
          </div>
          <CardTitle className="text-xl">Register New Scholarship Scheme</CardTitle>
          <CardDescription className="text-xs">
            Create the scheme container. After registration, you can use the declarative builder to
            configure form schemas, document matrices, eligibility rules, and workflows.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Scheme Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. NFST, NOS, ST_FELLOWSHIP"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm uppercase focus:border-gov-slate focus:outline-none focus:ring-1 focus:ring-gov-slate"
              />
              <p className="text-[11px] text-slate-500">
                Uppercase identifier used in API routes, case IDs, and rule references.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Scheme Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. National Overseas Scholarship for ST Students"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-gov-slate focus:outline-none focus:ring-1 focus:ring-gov-slate"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Ministry / Department <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={ministry}
                onChange={(e) => setMinistry(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-gov-slate focus:outline-none focus:ring-1 focus:ring-gov-slate"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Scheme Description &amp; Objective <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Describe the target audience, purpose, and financial scope of this scholarship..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-gov-slate focus:outline-none focus:ring-1 focus:ring-gov-slate"
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3 pt-2">
            <Link href="/admin/schemes">
              <Button type="button" variant="outline" size="sm">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isLoading}
              size="sm"
              className="gap-2 bg-gov-slate hover:bg-slate-800"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Create Scheme</span>
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
