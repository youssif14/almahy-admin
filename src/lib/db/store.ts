import "server-only";
import type { LegalCase } from "@/types";
import { LAWYERS, seedCases } from "./seed";

/**
 * In-memory repository. It stands in for a real database so the assessment
 * runs with zero infrastructure. Everything above this file talks to the
 * `db` object only, so swapping it for Prisma/Postgres touches one module.
 *
 * Note: on serverless hosts each instance keeps its own copy, and data
 * resets on cold start. That is acceptable for a demo and documented in the README.
 */
interface Store {
  cases: Map<string, LegalCase>;
  sequence: number;
}

const globalForStore = globalThis as unknown as { __almahyStore?: Store };

function createStore(): Store {
  const cases = seedCases();
  return { cases: new Map(cases.map((c) => [c.id, c])), sequence: cases.length };
}

const store = (globalForStore.__almahyStore ??= createStore());

export const db = {
  lawyers: {
    all: () => LAWYERS,
    find: (id: string) => LAWYERS.find((l) => l.id === id),
  },
  cases: {
    all: () => Array.from(store.cases.values()),
    find: (id: string) => store.cases.get(id),
    insert(input: Omit<LegalCase, "id" | "reference">): LegalCase {
      store.sequence += 1;
      const seq = String(store.sequence).padStart(4, "0");
      const record: LegalCase = { ...input, id: `case-${seq}`, reference: `ALM-${new Date(input.openedAt).getFullYear()}-${seq}` };
      store.cases.set(record.id, record);
      return record;
    },
    save(record: LegalCase) {
      store.cases.set(record.id, record);
      return record;
    },
    remove: (id: string) => store.cases.delete(id),
  },
};
