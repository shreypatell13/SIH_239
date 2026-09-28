"use client";

import React, { useState } from "react";
import { CaseStage } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { AddReviewNoteModal } from "./add-review-note-modal";
import { TransitionStageDialog } from "./transition-stage-dialog";

interface OfficerActionBarProps {
  caseId: string;
  currentStage: CaseStage;
  hasOpenDeficiencies: boolean;
  onActionCompleted: () => void;
  onIssueDeficiencyTrigger?: () => void;
}

export function OfficerActionBar({
  caseId,
  currentStage,
  hasOpenDeficiencies,
  onActionCompleted,
  onIssueDeficiencyTrigger,
}: OfficerActionBarProps) {
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);

  return (
    <>
      <div
        className="sticky bottom-0 z-20 flex flex-col items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white/95 p-3.5 text-xs shadow-lg backdrop-blur sm:flex-row"
        data-testid="officer-action-bar"
      >
        <div className="flex items-center gap-2 text-slate-600">
          <ShieldCheck className="h-4 w-4 text-gov-slate" />
          <span>
            Current Stage:{" "}
            <strong className="font-semibold text-slate-900">
              {currentStage.replace(/_/g, " ")}
            </strong>
          </span>
          {hasOpenDeficiencies && (
            <Badge variant="destructive" className="text-[10px]">
              Open Deficiencies Exist
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowNoteModal(true)}
            className="gap-1.5 text-xs"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Add Review Note
          </Button>

          {onIssueDeficiencyTrigger && (
            <Button
              size="sm"
              variant="outline"
              onClick={onIssueDeficiencyTrigger}
              className="gap-1.5 border-amber-300 text-xs text-amber-700 hover:bg-amber-50"
            >
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              Issue Deficiency
            </Button>
          )}

          <Button
            size="sm"
            variant="default"
            onClick={() => setShowTransitionDialog(true)}
            className="gap-1.5 bg-gov-slate text-xs hover:bg-slate-800"
          >
            Advance Case Stage
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <AddReviewNoteModal
        caseId={caseId}
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        onNoteAdded={onActionCompleted}
      />

      <TransitionStageDialog
        caseId={caseId}
        currentStage={currentStage}
        hasOpenDeficiencies={hasOpenDeficiencies}
        isOpen={showTransitionDialog}
        onClose={() => setShowTransitionDialog(false)}
        onTransitionCompleted={onActionCompleted}
      />
    </>
  );
}
