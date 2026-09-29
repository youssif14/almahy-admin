"use client";
import { Bar, BarChart, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Analytics } from "@/lib/analytics/compute";
import { formatAED, formatCompact } from "@/lib/utils";

const BRASS = "#86621f";
const SAGE = "#3e6b63";
const GRID = "#e5e9e7";
const AXIS = { fontSize: 12, fill: "#5b6870" };

export function TrendChart({ data }: { data: Analytics["trend"] }) {
  return (
    <figure>
      <figcaption className="sr-only">
        New cases per period shown as bars, fees billed shown as a line. Totals: {data.reduce((s, d) => s + d.newCases, 0)} cases.
      </figcaption>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} minTickGap={16} />
            <YAxis yAxisId="cases" tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} width={36} />
            <YAxis yAxisId="fees" orientation="right" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={44} />
            <Tooltip
              cursor={{ fill: "rgba(23,33,43,0.04)" }}
              contentStyle={{ borderRadius: 8, borderColor: "#dce1de", fontSize: 13 }}
              formatter={(value, name) => (name === "Fees billed" ? formatAED(Number(value)) : value)}
            />
            <Bar yAxisId="cases" dataKey="newCases" name="New cases" fill={SAGE} radius={[3, 3, 0, 0]} maxBarSize={28} />
            <Line yAxisId="fees" dataKey="revenue" name="Fees billed" stroke={BRASS} strokeWidth={2.5} dot={false} type="monotone" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex gap-5 text-xs text-muted" aria-hidden>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: SAGE }} />New cases</span>
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: BRASS }} />Fees billed</span>
      </div>
    </figure>
  );
}

export function ServiceChart({ data }: { data: Analytics["byService"] }) {
  return (
    <figure>
      <figcaption className="sr-only">Fees billed by service line.</figcaption>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={GRID} horizontal={false} />
            <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={formatCompact} />
            <YAxis type="category" dataKey="label" tick={AXIS} tickLine={false} axisLine={false} width={120} />
            <Tooltip
              cursor={{ fill: "rgba(23,33,43,0.04)" }}
              contentStyle={{ borderRadius: 8, borderColor: "#dce1de", fontSize: 13 }}
              formatter={(value) => formatAED(Number(value))}
            />
            <Bar dataKey="revenue" name="Fees billed" fill={BRASS} radius={[0, 3, 3, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
