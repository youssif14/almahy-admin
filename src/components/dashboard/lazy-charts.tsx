"use client";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Recharts is the heaviest dependency in the app. Loading it lazily keeps it
 * out of the initial JS for every other route; KPIs render instantly from
 * the server while the chart bundle streams in.
 */
const fallback = () => <Skeleton className="h-72 w-full" />;

export const TrendChart = dynamic(() => import("./charts").then((m) => m.TrendChart), { ssr: false, loading: fallback });
export const ServiceChart = dynamic(() => import("./charts").then((m) => m.ServiceChart), { ssr: false, loading: fallback });
