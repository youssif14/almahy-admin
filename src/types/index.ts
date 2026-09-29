export type Role = "admin" | "lawyer" | "viewer";

export type ServiceType =
  | "legal"
  | "corporate"
  | "notary"
  | "accounting"
  | "second-passport"
  | "expert-report";

export type CaseStatus = "intake" | "active" | "on-hold" | "closed-won" | "closed-lost";
export type Priority = "low" | "medium" | "high" | "urgent";
export type ClientType = "individual" | "company";
export type FeeType = "fixed" | "hourly";
export type Jurisdiction = "mainland" | "free-zone" | "offshore";

export interface Lawyer {
  id: string;
  name: string;
  title: string;
  active: boolean;
}

export interface Client {
  type: ClientType;
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  tradeLicense?: string;
}

export interface ActivityEntry {
  id: string;
  at: string; // ISO date
  actor: string;
  kind: "created" | "status" | "assigned" | "update" | "note" | "document";
  message: string;
}

export interface CaseDocument {
  id: string;
  name: string;
  sizeKb: number;
  uploadedAt: string;
}

export interface Billing {
  feeType: FeeType;
  amount?: number; // fixed fee, AED
  hourlyRate?: number; // AED
  estimatedHours?: number;
}

export interface LegalCase {
  id: string;
  reference: string; // e.g. ALM-2026-0142
  title: string;
  service: ServiceType;
  status: CaseStatus;
  priority: Priority;
  client: Client;
  lawyerId: string;
  openedAt: string;
  deadline?: string;
  closedAt?: string;
  summary: string;
  jurisdiction?: Jurisdiction;
  programCountry?: string;
  courtName?: string;
  billing: Billing;
  billed: number; // AED invoiced so far
  documents: CaseDocument[];
  activity: ActivityEntry[];
  updatedAt: string;
  version: number; // optimistic concurrency token
}

/** Lightweight row shape returned by the list endpoint (no activity / documents). */
export type CaseListItem = Omit<LegalCase, "activity" | "documents" | "summary"> & {
  documentCount: number;
};

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface ApiErrorBody {
  error: string;
  fieldErrors?: Record<string, string[]>;
}
