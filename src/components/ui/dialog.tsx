"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./button";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}

/**
 * Built on the native <dialog> element: focus is trapped, Escape closes it,
 * the rest of the page becomes inert, and focus returns to the trigger.
 */
export function Dialog({ open, onClose, title, description, children, footer }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()} // click on backdrop
      className="m-auto w-[min(92vw,28rem)] rounded-panel border border-line bg-surface p-0 text-ink shadow-[0_24px_60px_-20px_rgb(23_33_43/0.45)] open:animate-pop"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="font-serif text-xl leading-tight">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="-m-1 rounded p-1 text-muted hover:text-ink" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        {description && (
          <div id={descId} className="mt-2 text-sm text-muted">
            {description}
          </div>
        )}
        {children && <div className="mt-4">{children}</div>}
      </div>
      {footer && <div className="flex justify-end gap-2 border-t border-line bg-paper/60 px-6 py-3">{footer}</div>}
    </dialog>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  tone?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, description, confirmLabel, tone = "danger", loading, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading} autoFocus={tone === "danger"}>
            Cancel
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={loading} autoFocus={tone !== "danger"}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
