"use client";

import React from "react";
import { CaseTimelineEventDTO } from "@/server/domain/officer/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  UserCheck,
  FileCheck,
  Layers,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";

interface TimelineTabProps {
  timeline: CaseTimelineEventDTO[];
}

export function TimelineTab({ timeline }: TimelineTabProps) {
  const getEventIcon = (actionType: string) => {
    if (actionType.includes("APPLICATION")) {
      return <FileCheck className="h-3.5 w-3.5 text-blue-600" />;
    } else if (actionType.includes("ELIGIBILITY")) {
      return <Layers className="h-3.5 w-3.5 text-indigo-600" />;
    } else if (actionType.includes("DEFICIENCY")) {
      return <AlertCircle className="h-3.5 w-3.5 text-amber-600" />;
    } else if (actionType.includes("NOTE")) {
      return <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />;
    } else if (actionType.includes("TRANSITION") || actionType.includes("CLAIM")) {
      return <UserCheck className="h-3.5 w-3.5 text-gov-slate" />;
    }
    return <Clock className="h-3.5 w-3.5 text-slate-500" />;
  };

  return (
    <div className="space-y-4" data-testid="timeline-tab">
      <Card className="border-slate-200 shadow-none">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gov-slate" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Chronological Case Audit Trail
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {timeline.length === 0 ? (
            <p className="py-4 text-center text-xs italic text-slate-400">
              No audit events recorded.
            </p>
          ) : (
            <div className="relative ml-3 space-y-4 border-l border-slate-200 pl-4 text-xs">
              {timeline.map((event) => (
                <div key={event.id} className="group relative">
                  {/* Dot icon */}
                  <div className="absolute -left-[23px] top-0.5 rounded-full border-2 border-white bg-slate-100 p-0.5 shadow-sm">
                    {getEventIcon(event.actionType)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{event.title}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(event.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600">{event.description}</p>

                    <div className="flex items-center gap-2 pt-0.5 text-[10px] text-slate-400">
                      <span>
                        Actor:{" "}
                        <strong className="text-slate-700">{event.actorName || "System"}</strong>
                      </span>
                      {event.actorRole && (
                        <Badge variant="outline" className="px-1 py-0 text-[9px]">
                          {event.actorRole}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
