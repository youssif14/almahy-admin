import { z } from "zod";
import { JURISDICTION_KEYS, PRIORITY_KEYS, SERVICE_KEYS, STATUS_KEYS } from "./constants";

/**
 * Validation shared by the browser (react-hook-form) and the API routes.
 * The client validates for fast feedback; the server re-validates because
 * the client can never be trusted.
 */

const emptyToUndefined = (v: unknown) => (v === "" || v === null || (typeof v === "number" && Number.isNaN(v)) ? undefined : v);

const optionalText = (max: number) => z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());
const optionalPositive = (max: number, label: string) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce.number({ error: `${label} must be a number` }).positive(`${label} must be more than 0`).max(max).optional(),
  );

const PHONE = /^\+?[0-9\s-]{7,20}$/;
const TRADE_LICENSE = /^[A-Za-z0-9-]{5,20}$/;

export const clientStepSchema = z
  .object({
    type: z.enum(["individual", "company"]),
    name: z.string().trim().min(2, "Enter the client's full name").max(80),
    email: z.email("Enter a valid email address").max(120),
    phone: z.string().trim().regex(PHONE, "Use digits, spaces or dashes, e.g. +971 50 123 4567"),
    companyName: optionalText(120),
    tradeLicense: optionalText(20),
  })
  .superRefine((client, ctx) => {
    if (client.type !== "company") return;
    if (!client.companyName) ctx.addIssue({ code: "custom", path: ["companyName"], message: "Company clients need a company name" });
    if (!client.tradeLicense) ctx.addIssue({ code: "custom", path: ["tradeLicense"], message: "Company clients need a trade licence number" });
    else if (!TRADE_LICENSE.test(client.tradeLicense))
      ctx.addIssue({ code: "custom", path: ["tradeLicense"], message: "5–20 letters, digits or dashes" });
  });

export const matterStepSchema = z
  .object({
    title: z.string().trim().min(4, "Give the case a short descriptive title").max(120),
    service: z.enum(SERVICE_KEYS, { error: "Choose a service" }),
    priority: z.enum(PRIORITY_KEYS),
    lawyerId: z.string().min(1, "Assign a lawyer"),
    deadline: optionalText(10),
    summary: z.string().trim().min(20, "Add at least a couple of sentences (20+ characters)").max(2000),
    jurisdiction: z.preprocess(emptyToUndefined, z.enum(JURISDICTION_KEYS).optional()),
    programCountry: optionalText(60),
    courtName: optionalText(80),
  })
  .superRefine((m, ctx) => {
    if (m.service === "corporate" && !m.jurisdiction)
      ctx.addIssue({ code: "custom", path: ["jurisdiction"], message: "Choose where the company will be licensed" });
    if (m.service === "second-passport" && !m.programCountry)
      ctx.addIssue({ code: "custom", path: ["programCountry"], message: "Choose the citizenship program" });
    if (m.deadline) {
      const d = Date.parse(m.deadline);
      if (Number.isNaN(d)) ctx.addIssue({ code: "custom", path: ["deadline"], message: "Enter a valid date" });
      else if (d < startOfToday()) ctx.addIssue({ code: "custom", path: ["deadline"], message: "The deadline can't be in the past" });
    }
  });

export const billingStepSchema = z
  .object({
    feeType: z.enum(["fixed", "hourly"]),
    amount: optionalPositive(5_000_000, "Fee"),
    hourlyRate: optionalPositive(10_000, "Hourly rate"),
    estimatedHours: optionalPositive(2_000, "Hours"),
  })
  .superRefine((b, ctx) => {
    if (b.feeType === "fixed" && b.amount === undefined)
      ctx.addIssue({ code: "custom", path: ["amount"], message: "Enter the agreed fee" });
    if (b.feeType === "hourly") {
      if (b.hourlyRate === undefined) ctx.addIssue({ code: "custom", path: ["hourlyRate"], message: "Enter the hourly rate" });
      if (b.estimatedHours === undefined) ctx.addIssue({ code: "custom", path: ["estimatedHours"], message: "Estimate the hours" });
    }
  });

export const caseCreateSchema = z.object({
  client: clientStepSchema,
  matter: matterStepSchema,
  billing: billingStepSchema,
});

export type CaseCreateInput = z.input<typeof caseCreateSchema>;
export type CaseCreateValues = z.output<typeof caseCreateSchema>;

export const FORM_STEPS = [
  { key: "client", title: "Client", description: "Who we are acting for" },
  { key: "matter", title: "Matter", description: "What the case is about" },
  { key: "billing", title: "Billing and review", description: "Fees, then a final check" },
] as const;

export const caseUpdateSchema = z
  .object({
    version: z.number().int().positive(),
    title: z.string().trim().min(4).max(120).optional(),
    status: z.enum(STATUS_KEYS).optional(),
    priority: z.enum(PRIORITY_KEYS).optional(),
    lawyerId: z.string().min(1).optional(),
    deadline: z.string().max(30).nullable().optional(),
    summary: z.string().trim().min(20, "Add at least 20 characters").max(2000).optional(),
    client: z
      .object({
        email: z.email("Enter a valid email address").max(120),
        phone: z.string().trim().regex(PHONE, "Use digits, spaces or dashes"),
      })
      .partial()
      .optional(),
    note: z.string().trim().min(2).max(500).optional(),
  })
  .strict();

export type CaseUpdateInput = z.infer<typeof caseUpdateSchema>;

export const bulkActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("delete"), ids: z.array(z.string()).min(1).max(100) }),
  z.object({ action: z.literal("status"), ids: z.array(z.string()).min(1).max(100), status: z.enum(STATUS_KEYS) }),
  z.object({ action: z.literal("assign"), ids: z.array(z.string()).min(1).max(100), lawyerId: z.string().min(1) }),
]);

export type BulkActionInput = z.infer<typeof bulkActionSchema>;

/** Flattens zod issues into `{ "matter.deadline": ["..."] }` for forms. */
export function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
