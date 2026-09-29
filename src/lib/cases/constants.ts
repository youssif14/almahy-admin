import type { CaseStatus, Jurisdiction, Priority, ServiceType } from "@/types";

export const SERVICES: Record<ServiceType, string> = {
  legal: "Legal services",
  corporate: "Corporate services",
  notary: "Notary public",
  accounting: "Accounting",
  "second-passport": "Second passport",
  "expert-report": "Expert reports",
};

export const STATUSES: Record<CaseStatus, string> = {
  intake: "Intake",
  active: "Active",
  "on-hold": "On hold",
  "closed-won": "Won",
  "closed-lost": "Lost",
};

export const PRIORITIES: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const JURISDICTIONS: Record<Jurisdiction, string> = {
  mainland: "Dubai mainland (DET)",
  "free-zone": "Free zone",
  offshore: "Offshore",
};

export const PROGRAM_COUNTRIES = [
  "Antigua & Barbuda",
  "Dominica",
  "Grenada",
  "Malta",
  "Portugal",
  "St Kitts & Nevis",
  "St Lucia",
  "Türkiye",
] as const;

export const SERVICE_KEYS = Object.keys(SERVICES) as [ServiceType, ...ServiceType[]];
export const STATUS_KEYS = Object.keys(STATUSES) as [CaseStatus, ...CaseStatus[]];
export const PRIORITY_KEYS = Object.keys(PRIORITIES) as [Priority, ...Priority[]];
export const JURISDICTION_KEYS = Object.keys(JURISDICTIONS) as [Jurisdiction, ...Jurisdiction[]];

export const OPEN_STATUSES: CaseStatus[] = ["intake", "active", "on-hold"];

export const SORT_FIELDS = ["openedAt", "deadline", "reference", "client", "billed", "priority"] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export const PAGE_SIZES = [10, 20, 50] as const;
