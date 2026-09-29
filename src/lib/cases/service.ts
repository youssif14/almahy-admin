import "server-only";
import type { ActivityEntry, CaseStatus, LegalCase, SessionUser } from "@/types";
import { db } from "@/lib/db/store";
import { parseRange, computeAnalytics } from "@/lib/analytics/compute";
import { STATUSES } from "./constants";
import type { CaseQuery } from "./query-params";
import { findRelatedCases, queryCases } from "./query";
import type { BulkActionInput, CaseCreateValues, CaseUpdateInput } from "./schema";

/**
 * Business logic for cases. Route handlers (REST) and Server Components both
 * call these functions, so rules like "record every change in the timeline"
 * live in exactly one place.
 */

export class DomainError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

let activitySeq = 0;
function entry(actor: SessionUser, kind: ActivityEntry["kind"], message: string): ActivityEntry {
  activitySeq += 1;
  return { id: `act-${Date.now()}-${activitySeq}`, at: new Date().toISOString(), actor: actor.name, kind, message };
}

const isClosed = (s: CaseStatus) => s === "closed-won" || s === "closed-lost";

export const caseService = {
  list: (query: CaseQuery) => queryCases(db.cases.all(), query),

  get(id: string) {
    const record = db.cases.find(id);
    if (!record) throw new DomainError(404, "Case not found");
    return record;
  },

  related(record: LegalCase) {
    return findRelatedCases(db.cases.all(), record);
  },

  lawyers: () => db.lawyers.all(),

  analytics(from?: string | null, to?: string | null) {
    return computeAnalytics(db.cases.all(), db.lawyers.all(), parseRange(from, to));
  },

  create(input: CaseCreateValues, actor: SessionUser): LegalCase {
    const lawyer = db.lawyers.find(input.matter.lawyerId);
    // Server-only rule: the client can't know who is on leave today.
    if (!lawyer) throw new DomainError(422, "Check the highlighted fields", { "matter.lawyerId": ["This lawyer doesn't exist"] });
    if (!lawyer.active)
      throw new DomainError(422, "Check the highlighted fields", {
        "matter.lawyerId": [`${lawyer.name} is on leave and can't take new cases`],
      });

    const now = new Date().toISOString();
    const { client, matter, billing } = input;
    return db.cases.insert({
      title: matter.title,
      service: matter.service,
      status: "intake",
      priority: matter.priority,
      client: client.type === "company" ? client : { ...client, companyName: undefined, tradeLicense: undefined },
      lawyerId: lawyer.id,
      openedAt: now,
      deadline: matter.deadline ? new Date(`${matter.deadline}T12:00:00.000Z`).toISOString() : undefined,
      summary: matter.summary,
      jurisdiction: matter.service === "corporate" ? matter.jurisdiction : undefined,
      programCountry: matter.service === "second-passport" ? matter.programCountry : undefined,
      courtName: matter.service === "legal" ? matter.courtName : undefined,
      billing:
        billing.feeType === "fixed"
          ? { feeType: "fixed", amount: billing.amount }
          : { feeType: "hourly", hourlyRate: billing.hourlyRate, estimatedHours: billing.estimatedHours },
      billed: 0,
      documents: [],
      activity: [
        entry(actor, "assigned", `Assigned to ${lawyer.name}`),
        entry(actor, "created", "Case opened from the intake form"),
      ],
      updatedAt: now,
      version: 1,
    });
  },

  update(id: string, input: CaseUpdateInput, actor: SessionUser): LegalCase {
    const current = caseService.get(id);
    if (input.version !== current.version) {
      throw new DomainError(409, "Someone else changed this case. Reload to see their changes, then try again.");
    }
    const next: LegalCase = { ...current, client: { ...current.client }, activity: [...current.activity] };
    const log: ActivityEntry[] = [];

    if (input.status && input.status !== current.status) {
      next.status = input.status;
      next.closedAt = isClosed(input.status) ? new Date().toISOString() : undefined;
      log.push(entry(actor, "status", `Status changed from ${STATUSES[current.status]} to ${STATUSES[input.status]}`));
    }
    if (input.lawyerId && input.lawyerId !== current.lawyerId) {
      const lawyer = db.lawyers.find(input.lawyerId);
      if (!lawyer?.active) throw new DomainError(422, "That lawyer can't take cases right now", { lawyerId: ["Choose an available lawyer"] });
      next.lawyerId = lawyer.id;
      log.push(entry(actor, "assigned", `Reassigned to ${lawyer.name}`));
    }
    if (input.priority && input.priority !== current.priority) {
      next.priority = input.priority;
      log.push(entry(actor, "update", `Priority set to ${input.priority}`));
    }
    if (input.title && input.title !== current.title) {
      next.title = input.title;
      log.push(entry(actor, "update", "Title updated"));
    }
    if (input.summary && input.summary !== current.summary) {
      next.summary = input.summary;
      log.push(entry(actor, "update", "Case summary updated"));
    }
    if (input.deadline !== undefined) {
      next.deadline = input.deadline ? new Date(input.deadline).toISOString() : undefined;
      log.push(entry(actor, "update", input.deadline ? "Deadline changed" : "Deadline removed"));
    }
    if (input.client) {
      Object.assign(next.client, input.client);
      log.push(entry(actor, "update", "Client contact details updated"));
    }
    if (input.note) log.push(entry(actor, "note", input.note));

    next.activity = [...log.reverse(), ...current.activity];
    next.updatedAt = new Date().toISOString();
    next.version = current.version + 1;
    return db.cases.save(next);
  },

  remove(id: string) {
    caseService.get(id);
    db.cases.remove(id);
  },

  bulk(input: BulkActionInput, actor: SessionUser) {
    const records = input.ids.map((id) => db.cases.find(id)).filter((c): c is LegalCase => !!c);
    if (input.action === "delete") {
      records.forEach((c) => db.cases.remove(c.id));
      return { affected: records.length };
    }
    for (const c of records) {
      caseService.update(
        c.id,
        input.action === "status" ? { version: c.version, status: input.status } : { version: c.version, lawyerId: input.lawyerId },
        actor,
      );
    }
    return { affected: records.length };
  },
};
