"use client";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface FilterMenuProps<T extends string> {
  label: string;
  options: Record<T, string>;
  selected: T[];
  onChange: (next: T[]) => void;
}

/** Disclosure button + checkbox list. Escape or an outside click closes it and returns focus. */
export function FilterMenu<T extends string>({ label, options, selected, onChange }: FilterMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const toggle = (value: T) => onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          setOpen(false);
          buttonRef.current?.focus();
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-control border px-3 text-sm transition-colors",
          selected.length ? "border-brass/50 bg-brass-soft text-brass-strong" : "border-line-strong bg-surface text-ink hover:bg-paper",
        )}
      >
        {label}
        {selected.length > 0 && <span className="rounded-full bg-brass px-1.5 text-xs text-white">{selected.length}</span>}
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <fieldset
          id={panelId}
          className="absolute left-0 z-20 mt-1 w-56 animate-pop rounded-panel border border-line bg-surface p-2 shadow-[0_12px_32px_-12px_rgb(23_33_43/0.35)]"
        >
          <legend className="sr-only">{label}</legend>
          {(Object.entries(options) as [T, string][]).map(([value, text]) => (
            <label key={value} className="flex cursor-pointer items-center gap-2.5 rounded-control px-2 py-1.5 text-sm hover:bg-paper">
              <Checkbox checked={selected.includes(value)} onChange={() => toggle(value)} />
              {text}
            </label>
          ))}
          {selected.length > 0 && (
            <button type="button" onClick={() => onChange([])} className="mt-1 w-full rounded-control px-2 py-1.5 text-left text-xs text-muted hover:bg-paper">
              Clear {label.toLowerCase()}
            </button>
          )}
        </fieldset>
      )}
    </div>
  );
}
