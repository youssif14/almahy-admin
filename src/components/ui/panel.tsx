import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The one surface primitive. Header is optional; `flush` removes body padding for tables. */
export function Panel({
  title,
  description,
  actions,
  flush,
  className,
  children,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  flush?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("rounded-panel border border-line bg-surface", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            {title && <h2 className="font-serif text-lg leading-tight text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={flush ? undefined : "p-5"}>{children}</div>
    </section>
  );
}
