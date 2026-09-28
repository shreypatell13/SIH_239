"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, X } from "lucide-react";

interface AddReviewNoteModalProps {
  caseId: string;
  isOpen: boolean;
  onClose: () => void;
  onNoteAdded: () => void;
}

export function AddReviewNoteModal({
  caseId,
  isOpen,
  onClose,
  onNoteAdded,
}: AddReviewNoteModalProps) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (note.trim().length < 3) {
      setError("Review note must be at least 3 characters long.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/officer/cases/${caseId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to add review note.");
      }

      setNote("");
      onNoteAdded();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg space-y-4 rounded-lg bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-gov-slate" />
            <h3 className="text-sm font-bold text-slate-900">
              Record Internal Officer Review Note
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="rounded border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Audit Note (Internal Provenance Log)
            </label>
            <textarea
              rows={4}
              placeholder="e.g. Scanned ST certificate verified with State e-District database. Seal matches official format."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-gov-slate focus:outline-none focus:ring-1 focus:ring-gov-slate"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm" disabled={submitting}>
              {submitting ? "Recording..." : "Save Note to Audit Trail"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
