import clsx, { type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge resolves conflicts, so `cn("w-full", "w-auto")` yields `w-auto` (last one wins).
const twMerge = extendTailwindMerge({
  extend: { theme: { radius: ["control", "panel"] } },
});
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

const aed = new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

export const formatAED = (n: number) => aed.format(n);
export const formatCompact = (n: number) => compact.format(n);

export function formatDate(iso: string | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", opts).format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return formatDate(iso, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function relativeDays(iso: string, now = Date.now()) {
  const days = Math.round((Date.parse(iso) - now) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

/** YYYY-MM-DD in UTC, for date inputs and URL params. */
export const toDateInput = (d: Date) => d.toISOString().slice(0, 10);
