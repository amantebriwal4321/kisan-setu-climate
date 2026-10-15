import raw from "@/data/ledger.json";
import type { LedgerEntry } from "./core.d.mts";

export type Ledger = { name: string; genesis: string; note: string; entries: LedgerEntry[] };
export const LEDGER = raw as unknown as Ledger;
export const REPO_URL = "https://github.com/amantebriwal4321/kisan-setu-climate";
export const LEDGER_FILE_URL = `${REPO_URL}/blob/main/frontend/src/data/ledger.json`;
export const LEDGER_HISTORY_URL = `${REPO_URL}/commits/main/frontend/src/data/ledger.json`;

export function findLot(lotId: string): LedgerEntry | undefined {
  return LEDGER.entries.find((e) => e.record.lotId === lotId);
}

export function ledgerTotals() {
  const tonnes = LEDGER.entries.reduce((a, e) => a + e.record.tonnes, 0);
  const co2e = LEDGER.entries.reduce((a, e) => a + e.record.co2eAvoidedKg, 0);
  return { lots: LEDGER.entries.length, tonnes: Math.round(tonnes * 10) / 10, co2eKg: co2e, head: LEDGER.entries.at(-1)?.hash ?? LEDGER.genesis };
}
