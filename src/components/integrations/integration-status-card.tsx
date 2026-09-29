"use client";

import React, { useEffect, useState } from "react";
import {
  SystemIntegrationsHealthSummary,
  IntegrationHealth,
} from "@/server/integrations/core/types";
import {
  ShieldCheck,
  Server,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Lock,
  ExternalLink,
} from "lucide-react";

export function IntegrationStatusCard() {
  const [healthData, setHealthData] = useState<SystemIntegrationsHealthSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/health");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to fetch integration health`);
      }
      const json = await res.json();
      setHealthData(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading health");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "MOCK":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <ShieldCheck className="h-3 w-3" />
            MOCK / SYNTHETIC
          </span>
        );
      case "AVAILABLE":
      case "CONFIGURED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            AVAILABLE
          </span>
        );
      case "UNAVAILABLE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <AlertCircle className="h-3 w-3" />
            UNAVAILABLE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            <AlertCircle className="h-3 w-3" />
            ERROR
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">
                Government Integration Adapters
              </h3>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                Sandboxed / Synthetic
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Adapter boundaries for external portals with deterministic validation and audit
              security.
            </p>
          </div>
        </div>
        <button
          onClick={fetchHealth}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Status
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {error}
        </div>
      ) : isLoading && !healthData ? (
        <div className="mt-4 space-y-3">
          <div className="h-14 animate-pulse rounded-lg bg-muted/60" />
          <div className="h-14 animate-pulse rounded-lg bg-muted/60" />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {healthData?.providers.map((p: IntegrationHealth) => (
            <div
              key={p.providerId}
              className="flex flex-col justify-between rounded-lg border border-border bg-muted/30 p-3.5 transition-colors hover:bg-muted/50"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {p.providerId}
                  </span>
                  {getStatusBadge(p.status)}
                </div>
                <h4 className="mt-1.5 line-clamp-1 text-sm font-semibold text-foreground">
                  {p.providerName}
                </h4>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.message}</p>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Isolated Boundary
                </span>
                {p.latencyMs !== undefined && <span>{p.latencyMs}ms</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-accent/40 p-2.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-primary" />
          Security Policy: Real credentials and live government gateways are isolated behind
          strictly typed adapter boundaries.
        </span>
        <span className="text-[11px] opacity-75">
          Updated:{" "}
          {healthData?.timestamp
            ? new Date(healthData.timestamp).toLocaleTimeString("en-IN")
            : "Just now"}
        </span>
      </div>
    </div>
  );
}
