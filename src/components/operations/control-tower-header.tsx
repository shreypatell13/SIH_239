"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw, Filter } from "lucide-react";

interface ControlTowerHeaderProps {
  schemeCode: string;
  onSchemeChange: (code: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
  userRole?: string;
  userName?: string;
  schemes: Array<{ code: string; name: string }>;
}

export function ControlTowerHeader({
  schemeCode,
  onSchemeChange,
  isLoading,
  onRefresh,
  userRole = "OPERATIONS_DIRECTOR",
  userName,
  schemes,
}: ControlTowerHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 bg-white p-6 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gov-slate text-white shadow-sm">
            <Activity className="h-4 w-4" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Operations Control Tower
          </h1>
          <Badge variant="outline" className="border-gov-slate/30 font-bold text-gov-slate">
            {userRole}
          </Badge>
        </div>
        <p className="text-xs text-slate-500">
          Executive pipeline visibility &bull; Operational bottleneck diagnostics &bull; Systemic
          friction intelligence
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Scheme Selector */}
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-slate-600">Scheme:</span>
          <select
            value={schemeCode}
            onChange={(e) => onSchemeChange(e.target.value)}
            className="cursor-pointer bg-transparent font-bold text-slate-900 outline-none"
            data-testid="scheme-filter-select"
          >
            <option value="ALL">All Schemes</option>
            {schemes.map((scheme) => (
              <option key={scheme.code} value={scheme.code}>
                {scheme.code} ({scheme.name})
              </option>
            ))}
          </select>
        </div>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="gap-1.5 text-xs text-slate-700"
          data-testid="control-tower-refresh-btn"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-gov-saffron" : ""}`}
          />
          <span>Refresh</span>
        </Button>

        {userName && (
          <div className="hidden text-xs font-semibold text-slate-600 lg:block">{userName}</div>
        )}
      </div>
    </div>
  );
}
