"use client";
import Link from "next/link";
import { useForm, type FieldValues, type Path, type UseFormSetError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, FileText } from "lucide-react";
import type { CaseListItem, CaseStatus, LegalCase, Lawyer, Priority } from "@/types";
import { JURISDICTIONS, PRIORITIES, SERVICES, STATUSES } from "@/lib/cases/constants";
import { useCase, useLawyers, useUpdateCase } from "@/hooks/use-cases";
import { useCan } from "@/components/session-context";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { PriorityMark, StatusBadge } from "@/components/cases/badges";
import { formatAED, formatDate, relativeDays } from "@/lib/utils";
import { EditableSection } from "./editable-section";
import { Timeline } from "./timeline";

interface Props {
  initial: { case: LegalCase; related: CaseListItem[] };
  initialLawyers: Lawyer[];
}

export function CaseDetailView({ initial, initialLawyers }: Props) {
  const { data } = useCase(initial.case.id, initial);
  const { data: lawyers = initialLawyers } = useLawyers(initialLawyers);
  const update = useUpdateCase(initial.case.id);
  const canEdit = useCan("case:update");
  const canAssign = useCan("case:assign");

  const c = data?.case ?? initial.case;
  const related = data?.related ?? initial.related;
  const lawyer = lawyers.find((l) => l.id === c.lawyerId);
  const value = c.billing.feeType === "fixed" ? c.billing.amount ?? 0 : (c.billing.hourlyRate ?? 0) * (c.billing.estimatedHours ?? 0);

  const changeStatus = (status: CaseStatus) =>
    update.mutate({ status }, { onSuccess: () => toast.success(`Status changed to ${STATUSES[status]}`) });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/cases" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> All cases
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-muted">{c.reference}, {SERVICES[c.service]}</p>
            <h1 className="mt-1 font-serif text-3xl leading-tight">{c.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <StatusBadge status={c.status} />
              <PriorityMark priority={c.priority} />
              {c.deadline && <span className="text-sm text-muted">Due {formatDate(c.deadline)} ({relativeDays(c.deadline)})</span>}
            </div>
          </div>
          {canEdit && (
            <div className="flex items-center gap-2">
              <label htmlFor="status-quick" className="text-sm text-muted">Status</label>
              <Select id="status-quick" value={c.status} onChange={(e) => changeStatus(e.target.value as CaseStatus)} className="w-auto" disabled={update.isPending}>
                {Object.entries(STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <EditableSection
            title="Overview"
            canEdit={canEdit}
            view={
              <div className="flex flex-col gap-4">
                <p className="max-w-prose font-serif text-[1.05rem] leading-relaxed text-ink-soft">{c.summary}</p>
                <dl className="grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm sm:grid-cols-4">
                  <Detail label="Opened" value={formatDate(c.openedAt)} />
                  <Detail label="Deadline" value={formatDate(c.deadline)} />
                  <Detail label="Priority" value={PRIORITIES[c.priority]} />
                  <Detail label="Closed" value={formatDate(c.closedAt)} />
                </dl>
              </div>
            }
            edit={(close) => <OverviewForm record={c} onDone={close} />}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <EditableSection
              title="Client"
              canEdit={canEdit}
              view={
                <dl className="flex flex-col gap-3 text-sm">
                  <Detail label={c.client.type === "company" ? "Contact" : "Name"} value={c.client.name} />
                  {c.client.companyName && <Detail label="Company" value={`${c.client.companyName} (${c.client.tradeLicense})`} />}
                  <Detail label="Email" value={<a className="hover:underline" href={`mailto:${c.client.email}`}>{c.client.email}</a>} />
                  <Detail label="Phone" value={<a className="hover:underline" href={`tel:${c.client.phone.replace(/\s/g, "")}`}>{c.client.phone}</a>} />
                </dl>
              }
              edit={(close) => <ContactForm record={c} onDone={close} />}
            />
            <Panel title="Engagement">
              <dl className="flex flex-col gap-3 text-sm">
                {c.jurisdiction && <Detail label="Jurisdiction" value={JURISDICTIONS[c.jurisdiction]} />}
                {c.programCountry && <Detail label="Program" value={c.programCountry} />}
                {c.courtName && <Detail label="Court" value={c.courtName} />}
                <Detail
                  label="Fee"
                  value={c.billing.feeType === "fixed" ? `${formatAED(c.billing.amount ?? 0)} fixed` : `${formatAED(c.billing.hourlyRate ?? 0)}/hour, about ${c.billing.estimatedHours} hours`}
                />
                <div>
                  <dt className="text-muted">Billed so far</dt>
                  <dd className="mt-1">
                    {formatAED(c.billed)} <span className="text-muted">of {formatAED(value)}</span>
                    <div className="mt-2 h-1.5 rounded-full bg-line" role="img" aria-label={`${Math.round((c.billed / Math.max(value, 1)) * 100)}% billed`}>
                      <div className="h-full rounded-full bg-brass" style={{ width: `${Math.min(100, (c.billed / Math.max(value, 1)) * 100)}%` }} />
                    </div>
                  </dd>
                </div>
              </dl>
            </Panel>
          </div>

          <Panel title="Documents" flush>
            {c.documents.length ? (
              <ul className="divide-y divide-line">
                {c.documents.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                    <FileText className="size-4 text-muted" aria-hidden />
                    <span className="flex-1 truncate">{d.name}</span>
                    <span className="text-muted">{d.sizeKb} KB</span>
                    <span className="hidden text-muted sm:inline">{formatDate(d.uploadedAt)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-4 text-sm text-muted">No documents uploaded yet. The engagement letter is usually first.</p>
            )}
          </Panel>

          <Panel title="Other cases for this client" flush>
            {related.length ? (
              <ul className="divide-y divide-line">
                {related.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <Link href={`/cases/${r.id}`} className="min-w-0 hover:underline">
                      <span className="block truncate font-medium">{r.title}</span>
                      <span className="text-xs text-muted">{r.reference}, opened {formatDate(r.openedAt)}</span>
                    </Link>
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-4 text-sm text-muted">This is the only case for this client.</p>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Assigned lawyer">
            {canAssign ? (
              <div className="flex flex-col gap-2">
                <label htmlFor="assign" className="sr-only">Assigned lawyer</label>
                <Select
                  id="assign"
                  value={c.lawyerId}
                  disabled={update.isPending}
                  onChange={(e) => update.mutate({ lawyerId: e.target.value }, { onSuccess: () => toast.success("Case reassigned") })}
                >
                  {lawyers.map((l) => (
                    <option key={l.id} value={l.id} disabled={!l.active}>{l.name}{l.active ? "" : " (on leave)"}</option>
                  ))}
                </Select>
                <p className="text-xs text-muted">{lawyer?.title}</p>
              </div>
            ) : (
              <p className="text-sm">{lawyer?.name}<span className="block text-xs text-muted">{lawyer?.title}</span></p>
            )}
          </Panel>
          <Panel title="Activity">
            {canEdit && <NoteForm id={c.id} />}
            <Timeline entries={c.activity} />
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted">{label}</dt>
      <dd className="mt-0.5 truncate text-ink">{value}</dd>
    </div>
  );
}

/* ------------------------------ inline forms ------------------------------ */

const overviewSchema = z.object({
  title: z.string().trim().min(4, "At least 4 characters").max(120),
  summary: z.string().trim().min(20, "Add at least 20 characters").max(2000),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  deadline: z.string(),
});

/** Maps `{ "client.email": ["..."] }` from the API onto the matching form field. */
function applyServerErrors<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>) {
  if (err instanceof ApiError && err.fieldErrors) {
    for (const [key, messages] of Object.entries(err.fieldErrors)) {
      setError(key.split(".").pop() as Path<T>, { type: "server", message: messages[0] });
    }
  }
}

function OverviewForm({ record, onDone }: { record: LegalCase; onDone: () => void }) {
  const update = useUpdateCase(record.id);
  const form = useForm<z.infer<typeof overviewSchema>>({
    resolver: zodResolver(overviewSchema),
    defaultValues: { title: record.title, summary: record.summary, priority: record.priority, deadline: record.deadline?.slice(0, 10) ?? "" },
  });
  const onSubmit = form.handleSubmit(async (v) => {
    try {
      await update.mutateAsync({ title: v.title, summary: v.summary, priority: v.priority as Priority, deadline: v.deadline || null });
      toast.success("Overview saved");
      onDone();
    } catch (err) {
      applyServerErrors(err, form.setError);
    }
  });
  const e = form.formState.errors;
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Title" error={e.title?.message} required><Input {...form.register("title")} /></Field>
      <Field label="Summary" error={e.summary?.message} required><Textarea rows={5} {...form.register("summary")} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Priority" error={e.priority?.message}>
          <Select {...form.register("priority")}>{Object.entries(PRIORITIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
        </Field>
        <Field label="Deadline" hint="Leave empty to remove it"><Input type="date" {...form.register("deadline")} /></Field>
      </div>
      <FormActions onCancel={onDone} saving={form.formState.isSubmitting} />
    </form>
  );
}

const contactSchema = z.object({
  email: z.email("Enter a valid email address"),
  phone: z.string().trim().regex(/^\+?[0-9\s-]{7,20}$/, "Use digits, spaces or dashes"),
});

function ContactForm({ record, onDone }: { record: LegalCase; onDone: () => void }) {
  const update = useUpdateCase(record.id);
  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: { email: record.client.email, phone: record.client.phone },
  });
  const onSubmit = form.handleSubmit(async (client) => {
    try {
      await update.mutateAsync({ client });
      toast.success("Contact details saved");
      onDone();
    } catch (err) {
      applyServerErrors(err, form.setError);
    }
  });
  const e = form.formState.errors;
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Email" error={e.email?.message} required><Input type="email" {...form.register("email")} /></Field>
      <Field label="Phone" error={e.phone?.message} required><Input type="tel" {...form.register("phone")} /></Field>
      <FormActions onCancel={onDone} saving={form.formState.isSubmitting} />
    </form>
  );
}

function NoteForm({ id }: { id: string }) {
  const update = useUpdateCase(id);
  const form = useForm<{ note: string }>({ defaultValues: { note: "" } });
  const onSubmit = form.handleSubmit(async ({ note }) => {
    if (note.trim().length < 2) return;
    try {
      await update.mutateAsync({ note: note.trim() });
      form.reset();
    } catch {
      /* toast shown by the mutation; the text stays in the box so nothing is lost */
    }
  });
  return (
    <form onSubmit={onSubmit} className="mb-6 flex flex-col gap-2">
      <label htmlFor="note" className="sr-only">Add a note</label>
      <Textarea id="note" rows={2} placeholder="Add a note for the team" className="min-h-0" {...form.register("note")}
        onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && onSubmit()} />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">Ctrl + Enter to post</span>
        <Button type="submit" size="sm" variant="secondary" loading={form.formState.isSubmitting}>Post note</Button>
      </div>
    </form>
  );
}

function FormActions({ onCancel, saving }: { onCancel: () => void; saving: boolean }) {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
      <Button type="submit" loading={saving}>Save changes</Button>
    </div>
  );
}
