import type {
  ActivityEntry,
  CaseStatus,
  ClientType,
  LegalCase,
  Lawyer,
  Priority,
  ServiceType,
} from "@/types";
import { PROGRAM_COUNTRIES } from "@/lib/cases/constants";

/** Deterministic PRNG so every environment (and every test) sees the same data. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const LAWYERS: Lawyer[] = [
  { id: "law-01", name: "Almahy Mohamed", title: "Managing partner", active: true },
  { id: "law-02", name: "Rania Haddad", title: "Senior associate, litigation", active: true },
  { id: "law-03", name: "Omar Siddiqui", title: "Corporate counsel", active: true },
  { id: "law-04", name: "Leila Farouk", title: "Notary and attestation lead", active: true },
  { id: "law-05", name: "Karim Nasser", title: "Tax and accounting advisor", active: true },
  { id: "law-06", name: "Hana Al Suwaidi", title: "Citizenship programs advisor", active: false },
];

const FIRST = ["Ahmed", "Sara", "Mohammed", "Fatima", "Khalid", "Aisha", "Yousef", "Mariam", "Daniel", "Elena", "Rahul", "Chen", "Noura", "James", "Layla", "Tariq"];
const LAST = ["Al Mansoori", "Haddad", "Rahman", "Khan", "Al Hashimi", "Petrova", "Menon", "Wei", "Al Falasi", "Carter", "Aziz", "Ibrahim"];
const COMPANIES = ["Bonyan Holding", "Tabarak Trading", "Masha Interiors", "Gulf Crest Logistics", "Nakheel Ridge Realty", "Desert Pearl Clinics", "Zenith Fintech", "Al Waha Foods", "Meridian Marine", "Sahara Solar"];

const TITLES: Record<ServiceType, string[]> = {
  legal: ["Commercial lease dispute", "Employment termination claim", "Debt recovery", "Contract breach claim", "Rental dispute at RDSC"],
  corporate: ["LLC formation", "Trade licence renewal", "Shareholder agreement", "Branch office setup", "Change of partners"],
  notary: ["Power of attorney", "Document attestation", "Legal declaration", "Company MOA notarization"],
  accounting: ["VAT registration", "Corporate tax filing", "Annual bookkeeping", "Payroll setup (WPS)"],
  "second-passport": ["Citizenship by investment", "Residency by investment", "Family application"],
  "expert-report": ["Construction delay report", "Insurance claim assessment", "Financial loss report"],
};

const COURTS = ["Dubai Courts", "DIFC Courts", "Rental Disputes Center", "Abu Dhabi Judicial Department"];

const SERVICE_WEIGHTS: [ServiceType, number][] = [
  ["legal", 30], ["corporate", 24], ["notary", 16], ["accounting", 14], ["second-passport", 8], ["expert-report", 8],
];

const DAY = 86_400_000;

function pick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)];
}

function weighted<T>(rand: () => number, entries: [T, number][]): T {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [value, w] of entries) {
    r -= w;
    if (r <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

export function seedCases(count = 260, now = Date.now()): LegalCase[] {
  const rand = mulberry32(1987); // founding year of the firm
  const cases: LegalCase[] = [];

  for (let i = 0; i < count; i++) {
    const service = weighted(rand, SERVICE_WEIGHTS);
    // Skew towards recent months so charts show growth.
    const ageDays = Math.floor(Math.pow(rand(), 1.4) * 540);
    const opened = new Date(now - ageDays * DAY - Math.floor(rand() * DAY));
    const clientType: ClientType = service === "corporate" || rand() > 0.6 ? "company" : "individual";
    const first = pick(rand, FIRST);
    const last = pick(rand, LAST);
    const company = pick(rand, COMPANIES);
    const lawyer = service === "notary" ? LAWYERS[3] : service === "accounting" ? LAWYERS[4] : service === "second-passport" ? LAWYERS[5] : pick(rand, LAWYERS.slice(0, 3));

    let status: CaseStatus;
    if (ageDays < 20) status = rand() > 0.4 ? "intake" : "active";
    else if (ageDays < 120) status = weighted(rand, [["active", 55], ["on-hold", 15], ["closed-won", 22], ["closed-lost", 8]]);
    else status = weighted(rand, [["active", 12], ["on-hold", 6], ["closed-won", 64], ["closed-lost", 18]]);

    const priority: Priority = weighted(rand, [["low", 20], ["medium", 45], ["high", 25], ["urgent", 10]]);
    const hourly = service === "legal" || service === "expert-report" ? rand() > 0.4 : rand() > 0.85;
    const billing = hourly
      ? { feeType: "hourly" as const, hourlyRate: pick(rand, [650, 850, 1100, 1500]), estimatedHours: 10 + Math.floor(rand() * 60) }
      : { feeType: "fixed" as const, amount: Math.round((2_000 + rand() * (service === "second-passport" ? 60_000 : 25_000)) / 50) * 50 };
    const value = billing.feeType === "fixed" ? billing.amount! : billing.hourlyRate! * billing.estimatedHours!;
    const closed = status === "closed-won" || status === "closed-lost";
    const billed = closed ? value : Math.round(value * rand() * 0.8);

    const seq = String(i + 1).padStart(4, "0");
    const id = `case-${seq}`;
    const lawyerName = lawyer.name;
    const activity: ActivityEntry[] = [
      { id: `${id}-a1`, at: opened.toISOString(), actor: "Intake desk", kind: "created", message: "Case opened from client enquiry" },
      { id: `${id}-a2`, at: new Date(opened.getTime() + 2 * 3_600_000).toISOString(), actor: "Almahy Mohamed", kind: "assigned", message: `Assigned to ${lawyerName}` },
    ];
    if (status !== "intake") {
      activity.push({ id: `${id}-a3`, at: new Date(opened.getTime() + 3 * DAY).toISOString(), actor: lawyerName, kind: "document", message: "Uploaded engagement letter" });
      activity.push({ id: `${id}-a4`, at: new Date(opened.getTime() + 4 * DAY).toISOString(), actor: lawyerName, kind: "status", message: "Status changed from Intake to Active" });
    }
    const closedAt = closed ? new Date(Math.min(now, opened.getTime() + (20 + Math.floor(rand() * 100)) * DAY)).toISOString() : undefined;
    if (closedAt) {
      activity.push({ id: `${id}-a5`, at: closedAt, actor: lawyerName, kind: "status", message: `Case closed as ${status === "closed-won" ? "won" : "lost"}` });
    }

    const deadline = closed ? undefined : new Date(now + (Math.floor(rand() * 90) - 10) * DAY).toISOString();
    cases.push({
      id,
      reference: `ALM-${opened.getFullYear()}-${seq}`,
      title: pick(rand, TITLES[service]),
      service,
      status,
      priority,
      client: {
        type: clientType,
        name: `${first} ${last}`,
        email: `${first}.${last}`.toLowerCase().replace(/\s+/g, "") + "@example.com",
        phone: `+971 5${Math.floor(rand() * 9)} ${String(Math.floor(rand() * 9_000_000) + 1_000_000)}`,
        ...(clientType === "company" ? { companyName: company, tradeLicense: `DED-${Math.floor(100000 + rand() * 899999)}` } : {}),
      },
      lawyerId: lawyer.id,
      openedAt: opened.toISOString(),
      deadline,
      closedAt,
      summary: `Client engaged Almahy for ${TITLES[service][0].toLowerCase()} matters. Initial documents reviewed and next steps agreed with the client.`,
      ...(service === "corporate" ? { jurisdiction: pick(rand, ["mainland", "free-zone", "offshore"] as const) } : {}),
      ...(service === "second-passport" ? { programCountry: pick(rand, PROGRAM_COUNTRIES) } : {}),
      ...(service === "legal" ? { courtName: pick(rand, COURTS) } : {}),
      billing,
      billed,
      documents:
        status === "intake"
          ? []
          : [
              { id: `${id}-d1`, name: "Engagement letter.pdf", sizeKb: 180 + Math.floor(rand() * 200), uploadedAt: new Date(opened.getTime() + 3 * DAY).toISOString() },
              { id: `${id}-d2`, name: clientType === "company" ? "Trade licence.pdf" : "Passport copy.pdf", sizeKb: 400 + Math.floor(rand() * 900), uploadedAt: new Date(opened.getTime() + 3 * DAY).toISOString() },
            ],
      activity: activity.reverse(),
      updatedAt: (closedAt ?? opened.toISOString()),
      version: 1,
    });
  }
  return cases;
}
