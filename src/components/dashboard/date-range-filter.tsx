"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, toDateInput } from "@/lib/utils";

const DAY = 86_400_000;
const PRESETS = [
  { id: "30d", label: "30 days", days: 30 },
  { id: "90d", label: "90 days", days: 90 },
  { id: "6m", label: "6 months", days: 182 },
  { id: "12m", label: "12 months", days: 365 },
] as const;

export function DateRangeFilter({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [custom, setCustom] = useState({ from, to });
  const [nowMs] = useState(() => Date.now()); // read the clock once, not on every render

  const today = toDateInput(new Date(nowMs));
  const presetFrom = (days: number) => toDateInput(new Date(nowMs - (days - 1) * DAY));
  const activePreset = to === today ? PRESETS.find((p) => presetFrom(p.days) === from)?.id : undefined;

  function apply(next: { from: string; to: string }) {
    const sp = new URLSearchParams(params);
    sp.set("from", next.from);
    sp.set("to", next.to);
    setCustom(next);
    // Transition keeps the current dashboard on screen while the server renders the new range.
    startTransition(() => router.push(`${pathname}?${sp.toString()}`, { scroll: false }));
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-busy={pending}>
      <div role="group" aria-label="Date range presets" className="flex rounded-control border border-line-strong bg-surface p-0.5">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={activePreset === p.id}
            onClick={() => apply({ from: presetFrom(p.days), to: today })}
            className={cn(
              "rounded-[4px] px-2.5 py-1.5 text-xs font-medium transition-colors",
              activePreset === p.id ? "bg-ink text-white" : "text-ink-soft hover:bg-paper",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <form
        className="flex w-full items-center gap-1.5 sm:w-auto"
        onSubmit={(e) => {
          e.preventDefault();
          if (custom.from && custom.to && custom.from <= custom.to) apply(custom);
        }}
      >
        <label className="sr-only" htmlFor="range-from">From</label>
        <Input id="range-from" type="date" value={custom.from} max={custom.to} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} className="h-9 min-w-0 flex-1 sm:w-[9.5rem] sm:flex-none" />
        <span className="text-muted" aria-hidden>to</span>
        <label className="sr-only" htmlFor="range-to">To</label>
        <Input id="range-to" type="date" value={custom.to} min={custom.from} max={today} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} className="h-9 min-w-0 flex-1 sm:w-[9.5rem] sm:flex-none" />
        <Button type="submit" variant="secondary" size="sm" disabled={custom.from > custom.to}>
          Apply
        </Button>
      </form>
      {pending && <Loader2 className="size-4 animate-spin text-muted" aria-label="Updating dashboard" />}
    </div>
  );
}
