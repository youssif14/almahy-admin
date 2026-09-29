"use client";
import { useState } from "react";
import type { CaseStatus, Lawyer } from "@/types";
import { STATUSES } from "@/lib/cases/constants";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";

interface BulkBarProps {
  count: number;
  lawyers: Lawyer[];
  canAssign: boolean;
  canDelete: boolean;
  busy: boolean;
  onStatus: (status: CaseStatus) => void;
  onAssign: (lawyerId: string) => void;
  onDelete: () => void;
  onClear: () => void;
}

export function BulkBar({ count, lawyers, canAssign, canDelete, busy, onStatus, onAssign, onDelete, onClear }: BulkBarProps) {
  const [status, setStatus] = useState<CaseStatus | "">("");
  const [lawyer, setLawyer] = useState("");

  return (
    <div role="region" aria-label="Bulk actions" className="flex animate-fade flex-wrap items-center gap-2 border-b border-brass/30 bg-brass-soft px-4 py-2.5 text-sm">
      <p className="mr-2 font-medium text-brass-strong" aria-live="polite">
        {count} selected
      </p>
      <div className="flex items-center gap-1.5">
        <label htmlFor="bulk-status" className="sr-only">New status</label>
        <Select id="bulk-status" value={status} onChange={(e) => setStatus(e.target.value as CaseStatus)} className="h-8 w-auto">
          <option value="">Change status</option>
          {Object.entries(STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
        <Button size="sm" variant="secondary" disabled={!status || busy} onClick={() => status && onStatus(status)}>Apply</Button>
      </div>
      {canAssign && (
        <div className="flex items-center gap-1.5">
          <label htmlFor="bulk-lawyer" className="sr-only">Assign to</label>
          <Select id="bulk-lawyer" value={lawyer} onChange={(e) => setLawyer(e.target.value)} className="h-8 w-auto">
            <option value="">Assign to</option>
            {lawyers.filter((l) => l.active).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </Select>
          <Button size="sm" variant="secondary" disabled={!lawyer || busy} onClick={() => lawyer && onAssign(lawyer)}>Assign</Button>
        </div>
      )}
      {canDelete && <Button size="sm" variant="danger" disabled={busy} onClick={onDelete}>Delete</Button>}
      <Button size="sm" variant="ghost" onClick={onClear} className="ml-auto">Clear selection</Button>
    </div>
  );
}
