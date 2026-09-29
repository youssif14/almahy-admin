"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CheckCircle2, CloudOff, Loader2 } from "lucide-react";
import type { LegalCase, Lawyer } from "@/types";
import { caseCreateSchema, FORM_STEPS, type CaseCreateInput, type CaseCreateValues } from "@/lib/cases/schema";
import { JURISDICTIONS, PRIORITIES, PROGRAM_COUNTRIES, SERVICES } from "@/lib/cases/constants";
import { useCreateCase } from "@/hooks/use-cases";
import { readDraft, useAutosave, type Draft } from "@/hooks/use-autosave";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Field, Fieldset } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { cn, formatAED, formatDate, toDateInput } from "@/lib/utils";

const DRAFT_KEY = "almahy:new-case-draft:v1";

const EMPTY: CaseCreateInput = {
  client: { type: "individual", name: "", email: "", phone: "", companyName: "", tradeLicense: "" },
  matter: { title: "", service: "legal", priority: "medium", lawyerId: "", deadline: "", summary: "", jurisdiction: "", programCountry: "", courtName: "" },
  billing: { feeType: "fixed", amount: "", hourlyRate: "", estimatedHours: "" },
};

export function CaseForm({ lawyers }: { lawyers: Lawyer[] }) {
  const [step, setStep] = useState(0);
  const [created, setCreated] = useState<LegalCase | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingDraft, setPendingDraft] = useState<Draft<CaseCreateInput> | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const create = useCreateCase();

  const form = useForm<CaseCreateInput, unknown, CaseCreateValues>({
    resolver: zodResolver(caseCreateSchema),
    defaultValues: EMPTY,
    mode: "onTouched", // validate a field once the user leaves it, then live
  });
  const { register, control, trigger, handleSubmit, setError, reset, formState } = form;
  const errors = formState.errors;

  const values = useWatch({ control }) as CaseCreateInput;
  const clientType = values.client?.type;
  const service = values.matter?.service;
  const feeType = values.billing?.feeType;

  const autosave = useAutosave(DRAFT_KEY, values, step, { enabled: !created });

  // Offer to restore a draft left from an earlier visit (read after mount: localStorage is browser-only).
  useEffect(() => {
    const draft = readDraft<CaseCreateInput>(DRAFT_KEY);
    if (draft) setPendingDraft(draft);
  }, []);

  // Move focus to the step heading so keyboard and screen-reader users know the step changed.
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) headingRef.current?.focus();
    mounted.current = true;
  }, [step]);

  const stepKey = FORM_STEPS[step].key;

  async function next() {
    setFormError(null);
    if (await trigger(stepKey, { shouldFocus: true })) setStep((s) => s + 1);
  }

  const onSubmit = handleSubmit(async (data) => {
    setFormError(null);
    try {
      const record = await create.mutateAsync(data);
      autosave.clear();
      setCreated(record);
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        const keys = Object.keys(err.fieldErrors);
        keys.forEach((k) => setError(k as FieldPath<CaseCreateInput>, { type: "server", message: err.fieldErrors![k][0] }));
        // Jump back to the step that owns the first server error.
        const target = FORM_STEPS.findIndex((s) => keys.some((k) => k.startsWith(`${s.key}.`)));
        if (target >= 0) setStep(target);
      }
      setFormError(err instanceof ApiError ? err.message : "The case couldn't be created. Your answers are saved as a draft; try again.");
    }
  });

  if (created) {
    return (
      <Panel className="mx-auto max-w-xl">
        <div className="flex flex-col items-center gap-3 py-8 text-center" role="status">
          <CheckCircle2 className="size-10 text-won" aria-hidden />
          <h2 className="font-serif text-2xl">Case opened</h2>
          <p className="text-muted">
            {created.reference} is now in intake and assigned. The client&apos;s details and the fee agreement are on the case file.
          </p>
          <div className="mt-2 flex gap-2">
            <Link href={`/cases/${created.id}`} className="inline-flex h-10 items-center rounded-control bg-brass px-4 text-sm font-medium text-white hover:bg-brass-strong">
              View case
            </Link>
            <Button variant="secondary" onClick={() => { reset(EMPTY); setStep(0); setCreated(null); }}>
              Open another case
            </Button>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
      {/* Stepper: completed steps are clickable, future steps are not. */}
      <nav aria-label="Form progress">
        <ol className="flex gap-2 lg:flex-col lg:gap-1">
          {FORM_STEPS.map((s, i) => {
            const state = i < step ? "done" : i === step ? "current" : "todo";
            return (
              <li key={s.key} className="flex-1 lg:flex-none">
                <button
                  type="button"
                  disabled={state === "todo"}
                  onClick={() => setStep(i)}
                  aria-current={state === "current" ? "step" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-control px-2 py-2 text-left text-sm transition-colors",
                    state === "current" && "bg-surface shadow-[inset_0_0_0_1px_var(--color-line)]",
                    state === "done" && "hover:bg-surface",
                    state === "todo" && "cursor-default text-muted",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                      state === "done" && "border-won bg-won text-white",
                      state === "current" && "border-brass text-brass",
                      state === "todo" && "border-line-strong",
                    )}
                    aria-hidden
                  >
                    {state === "done" ? <Check className="size-3.5" /> : i + 1}
                  </span>
                  <span className="hidden sm:block">
                    <span className="block font-medium">{s.title}</span>
                    <span className="hidden text-xs text-muted lg:block">{s.description}</span>
                  </span>
                  <span className="sr-only">{state === "done" ? "(completed)" : state === "todo" ? "(not started)" : ""}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <AutosaveStatus status={autosave.status} savedAt={autosave.savedAt} />
      </nav>

      <form onSubmit={(e) => (step < FORM_STEPS.length - 1 ? (e.preventDefault(), void next()) : onSubmit(e))} noValidate>
        <Panel>
          {pendingDraft && (
            <div role="region" aria-label="Saved draft" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-control border border-brass/30 bg-brass-soft px-4 py-3 text-sm">
              <p>You have an unfinished case from {formatDate(pendingDraft.savedAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}.</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => { reset(pendingDraft.values); setStep(Math.min(pendingDraft.step, FORM_STEPS.length - 1)); setPendingDraft(null); }}>
                  Restore draft
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { autosave.clear(); setPendingDraft(null); }}>
                  Discard
                </Button>
              </div>
            </div>
          )}

          <h2 ref={headingRef} tabIndex={-1} className="font-serif text-2xl outline-none">
            {FORM_STEPS[step].title}
          </h2>
          <p className="mb-6 text-sm text-muted">Step {step + 1} of {FORM_STEPS.length}. {FORM_STEPS[step].description}.</p>

          {formError && (
            <p role="alert" className="mb-6 rounded-control border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
              {formError}
            </p>
          )}

          {step === 0 && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Fieldset legend="Client type">
                <div className="flex gap-2">
                  {(["individual", "company"] as const).map((t) => (
                    <label key={t} className={cn("flex flex-1 cursor-pointer items-center gap-2 rounded-control border px-3 py-2.5 text-sm", clientType === t ? "border-brass bg-brass-soft" : "border-line-strong")}>
                      <input type="radio" value={t} className="accent-brass" {...register("client.type")} />
                      {t === "individual" ? "Individual" : "Company"}
                    </label>
                  ))}
                </div>
              </Fieldset>
              <div className="hidden sm:block" />
              <Field label={clientType === "company" ? "Contact person" : "Full name"} error={errors.client?.name?.message} required>
                <Input autoComplete="name" {...register("client.name")} />
              </Field>
              <Field label="Email" error={errors.client?.email?.message} required>
                <Input type="email" autoComplete="email" {...register("client.email")} />
              </Field>
              <Field label="Phone" error={errors.client?.phone?.message} hint="Include the country code" required>
                <Input type="tel" autoComplete="tel" placeholder="+971 50 123 4567" {...register("client.phone")} />
              </Field>
              {clientType === "company" && (
                <>
                  <Field label="Company name" error={errors.client?.companyName?.message} required className="animate-fade">
                    <Input autoComplete="organization" {...register("client.companyName")} />
                  </Field>
                  <Field label="Trade licence number" error={errors.client?.tradeLicense?.message} required className="animate-fade">
                    <Input placeholder="DED-123456" {...register("client.tradeLicense")} />
                  </Field>
                </>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Case title" error={errors.matter?.title?.message} className="sm:col-span-2" required>
                <Input placeholder="e.g. Commercial lease dispute" {...register("matter.title")} />
              </Field>
              <Field label="Service" error={errors.matter?.service?.message} required>
                <Select {...register("matter.service")}>
                  {Object.entries(SERVICES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
              </Field>
              <Field label="Priority" error={errors.matter?.priority?.message}>
                <Select {...register("matter.priority")}>
                  {Object.entries(PRIORITIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
              </Field>
              {service === "corporate" && (
                <Field label="Licensing jurisdiction" error={errors.matter?.jurisdiction?.message} required className="animate-fade">
                  <Select {...register("matter.jurisdiction")}>
                    <option value="">Choose one</option>
                    {Object.entries(JURISDICTIONS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </Select>
                </Field>
              )}
              {service === "second-passport" && (
                <Field label="Citizenship program" error={errors.matter?.programCountry?.message} required className="animate-fade">
                  <Select {...register("matter.programCountry")}>
                    <option value="">Choose one</option>
                    {PROGRAM_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </Field>
              )}
              {service === "legal" && (
                <Field label="Court or tribunal" error={errors.matter?.courtName?.message} hint="If proceedings are already filed" className="animate-fade">
                  <Input placeholder="e.g. Dubai Courts" {...register("matter.courtName")} />
                </Field>
              )}
              <Field label="Assigned lawyer" error={errors.matter?.lawyerId?.message} hint="Availability is confirmed when you open the case" required>
                <Select {...register("matter.lawyerId")}>
                  <option value="">Choose a lawyer</option>
                  {lawyers.map((l) => <option key={l.id} value={l.id}>{l.name}{l.active ? "" : " (on leave)"}</option>)}
                </Select>
              </Field>
              <Field label="Deadline" error={errors.matter?.deadline?.message} hint="Hearing, filing or delivery date">
                <Input type="date" min={toDateInput(new Date())} {...register("matter.deadline")} />
              </Field>
              <Field label="Summary" error={errors.matter?.summary?.message} className="sm:col-span-2" required hint="What the client needs and anything already agreed">
                <Textarea rows={5} {...register("matter.summary")} />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <Fieldset legend="Fee arrangement">
                  <div className="flex gap-2">
                    {(["fixed", "hourly"] as const).map((t) => (
                      <label key={t} className={cn("flex flex-1 cursor-pointer items-center gap-2 rounded-control border px-3 py-2.5 text-sm", feeType === t ? "border-brass bg-brass-soft" : "border-line-strong")}>
                        <input type="radio" value={t} className="accent-brass" {...register("billing.feeType")} />
                        {t === "fixed" ? "Fixed fee" : "Hourly"}
                      </label>
                    ))}
                  </div>
                </Fieldset>
                <div className="hidden sm:block" />
                {feeType === "fixed" ? (
                  <Field label="Agreed fee (AED)" error={errors.billing?.amount?.message} required className="animate-fade">
                    <Input type="number" inputMode="decimal" min={0} step={50} {...register("billing.amount")} />
                  </Field>
                ) : (
                  <>
                    <Field label="Hourly rate (AED)" error={errors.billing?.hourlyRate?.message} required className="animate-fade">
                      <Input type="number" inputMode="decimal" min={0} step={50} {...register("billing.hourlyRate")} />
                    </Field>
                    <Field label="Estimated hours" error={errors.billing?.estimatedHours?.message} required className="animate-fade">
                      <Input type="number" inputMode="numeric" min={0} {...register("billing.estimatedHours")} />
                    </Field>
                  </>
                )}
              </div>
              <Review values={values} lawyers={lawyers} onEdit={setStep} />
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0 || formState.isSubmitting}>
              Back
            </Button>
            {step < FORM_STEPS.length - 1 ? (
              <Button type="submit">Continue to {FORM_STEPS[step + 1].title.toLowerCase()}</Button>
            ) : (
              <Button type="submit" loading={formState.isSubmitting}>
                {formState.isSubmitting ? "Opening case" : "Open case"}
              </Button>
            )}
          </div>
        </Panel>
      </form>
    </div>
  );
}

function AutosaveStatus({ status, savedAt }: { status: string; savedAt: string | null }) {
  return (
    <p className="mt-4 hidden items-center gap-1.5 px-2 text-xs text-muted lg:flex" aria-live="polite">
      {status === "saving" && <><Loader2 className="size-3 animate-spin" aria-hidden /> Saving draft</>}
      {status === "saved" && savedAt && <>Draft saved at {formatDate(savedAt, { hour: "2-digit", minute: "2-digit" })}</>}
      {status === "error" && <><CloudOff className="size-3" aria-hidden /> Drafts can&apos;t be saved in this browser</>}
    </p>
  );
}

function Review({ values, lawyers, onEdit }: { values: CaseCreateInput; lawyers: Lawyer[]; onEdit: (step: number) => void }) {
  const { client, matter, billing } = values;
  const lawyer = lawyers.find((l) => l.id === matter.lawyerId);
  const num = (v: unknown) => (v === "" || v == null ? 0 : Number(v));
  const fee = billing.feeType === "fixed" ? formatAED(num(billing.amount)) : `${formatAED(num(billing.hourlyRate))}/hour for about ${num(billing.estimatedHours)} hours`;

  const text = (v: unknown) => (v == null || v === "" ? undefined : String(v));
  const sections: { title: string; step: number; rows: [string, string | undefined][] }[] = [
    { title: "Client", step: 0, rows: [["Name", text(client.name)], ["Company", client.type === "company" ? text(client.companyName) : "Individual client"], ["Email", text(client.email)], ["Phone", text(client.phone)]] },
    { title: "Matter", step: 1, rows: [["Title", text(matter.title)], ["Service", SERVICES[matter.service as keyof typeof SERVICES]], ["Lawyer", lawyer?.name], ["Deadline", matter.deadline ? formatDate(String(matter.deadline)) : "None"]] },
    { title: "Fee", step: 2, rows: [["Arrangement", fee]] },
  ];

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">Check before opening</h3>
      <div className="divide-y divide-line rounded-panel border border-line">
        {sections.map((s) => (
          <div key={s.title} className="flex gap-4 px-4 py-3">
            <dl className="grid flex-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              {s.rows.map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="w-24 shrink-0 text-muted">{k}</dt>
                  <dd className="min-w-0 truncate">{v ?? <span className="text-muted">Not given</span>}</dd>
                </div>
              ))}
            </dl>
            {s.step < 2 && (
              <button type="button" onClick={() => onEdit(s.step)} className="self-start text-sm font-medium text-brass hover:underline">
                Edit<span className="sr-only"> {s.title.toLowerCase()}</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
