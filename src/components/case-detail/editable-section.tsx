"use client";
import { useState, type ReactNode } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

interface EditableSectionProps {
  title: string;
  canEdit: boolean;
  view: ReactNode;
  /** Render prop so the form can close the section after a successful save. */
  edit: (close: () => void) => ReactNode;
}

/** A panel with a read view and an inline edit form, toggled in place. */
export function EditableSection({ title, canEdit, view, edit }: EditableSectionProps) {
  const [editing, setEditing] = useState(false);
  return (
    <Panel
      title={title}
      actions={
        canEdit && !editing ? (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)} aria-label={`Edit ${title.toLowerCase()}`}>
            <Pencil className="size-3.5" aria-hidden /> Edit
          </Button>
        ) : undefined
      }
    >
      {editing ? <div className="animate-fade">{edit(() => setEditing(false))}</div> : view}
    </Panel>
  );
}
