// Ledger CLI. Same hashing code as the app (src/lib/ledger/core.mjs).
//   npx tsx scripts/ledger.mts verify            recompute every hash, exit 1 on tamper
//   npx tsx scripts/ledger.mts append lot.json   append one lot, refuses duplicates
//   npx tsx scripts/ledger.mts selftest          hashing, tamper and duplicate checks
//   npx tsx scripts/ledger.mts seed              rebuild the demo lots from scratch
// The ledger lives in src/data/ledger.json and is committed, so the git history of
// that file is a public, append-only witness of every anchored lot.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { appendEntry, verifyChain, farmerRef, GENESIS, sha256Hex, sha256Fallback, canonical } from "../src/lib/ledger/core.mjs";
import type { LedgerEntry, LotRecord } from "../src/lib/ledger/core.d.mts";
import { factorFor, co2eKg, SOURCES } from "../src/lib/climate/factors";
import { getCrop, UNITS } from "../src/lib/engine";
import { FARMERS } from "../src/data/farmers";

const here = dirname(fileURLToPath(import.meta.url));
const FILE = join(here, "..", "src", "data", "ledger.json");

type Ledger = { name: string; genesis: string; note: string; entries: LedgerEntry[] };

function load(): Ledger {
  return JSON.parse(readFileSync(FILE, "utf8"));
}
function save(l: Ledger) {
  writeFileSync(FILE, JSON.stringify(l, null, 2) + "\n");
}

async function verify() {
  const l = load();
  const res = await verifyChain(l.entries);
  for (const r of res.results) {
    const bad = [!r.hashOk && "hash", !r.linkOk && "link", !r.keyOk && "lotKey", r.duplicateOf && `dup of ${r.duplicateOf}`].filter(Boolean);
    console.log(`${r.lotId}  ${bad.length ? "FAIL " + bad.join(", ") : "ok"}`);
  }
  console.log(`entries ${l.entries.length}  head ${res.head}  ${res.ok ? "CHAIN OK" : "CHAIN BROKEN"}`);
  if (!res.ok) process.exit(1);
}

async function makeRecord(o: {
  lotId: string; farmerId: string; crop: string; tonnes: number; unit: string; product: string;
  harvestDate: string; routedAt: string; climateSignal: number | null; demo: boolean;
}): Promise<Omit<LotRecord, "lotKey">> {
  const farmer = FARMERS.find((f) => f.farmerId === o.farmerId);
  if (!farmer) throw new Error(`unknown farmer ${o.farmerId}`);
  const unit = UNITS.find((u) => u.slug === o.unit);
  if (!unit) throw new Error(`unknown unit ${o.unit}`);
  const crop = getCrop(o.crop);
  if (!crop) throw new Error(`unknown crop ${o.crop}`);
  const f = factorFor(o.crop, "crop");
  return {
    v: 1,
    lotId: o.lotId,
    crop: o.crop,
    cropName: crop.name,
    tonnes: o.tonnes,
    district: "Kolar, Karnataka",
    village: farmer.village,
    farmerRef: await farmerRef(farmer.farmerId),
    unit: unit.slug,
    unitName: unit.name,
    product: o.product,
    harvestDate: o.harvestDate,
    routedAt: o.routedAt,
    riskScore: crop.risk,
    climateSignal: o.climateSignal,
    efKgCo2ePerKg: f.ef,
    efSource: SOURCES.poore.short,
    co2eAvoidedKg: co2eKg(o.tonnes, f.ef),
    demo: o.demo,
  };
}

async function seed() {
  const lots = [
    { farmerId: "KA-KLR-1001", crop: "tomato", tonnes: 1.8, unit: "srinivaspura-fpo", product: "paste", harvestDate: "2026-10-08" },
    { farmerId: "KA-KLR-1002", crop: "tomato", tonnes: 2.1, unit: "chintamani-fpo", product: "pickle", harvestDate: "2026-10-09" },
    { farmerId: "KA-KLR-1003", crop: "tomato", tonnes: 1.2, unit: "kolar-mahila-foods", product: "puree", harvestDate: "2026-10-10" },
    { farmerId: "KA-KLR-1004", crop: "onion", tonnes: 1.6, unit: "mulbagal-cluster", product: "flakes", harvestDate: "2026-10-11" },
    { farmerId: "KA-KLR-1005", crop: "tomato", tonnes: 2.3, unit: "malur-womens-unit", product: "dried", harvestDate: "2026-10-12" },
    { farmerId: "KA-KLR-1006", crop: "tomato", tonnes: 1.4, unit: "bangarpet-shg", product: "paste", harvestDate: "2026-10-13" },
  ];
  const l: Ledger = {
    name: "Kisan Setu surplus lot ledger",
    genesis: GENESIS,
    note: "Demo lots built from the seeded Kolar series. Hash chained with SHA-256. Run `npx tsx scripts/ledger.mts verify` to check.",
    entries: [],
  };
  let n = 1;
  for (const lot of lots) {
    const routedAt = `${lot.harvestDate}T10:${String(10 + n).padStart(2, "0")}:00+05:30`;
    const rec = await makeRecord({ ...lot, lotId: `KLR-2026-${String(n).padStart(4, "0")}`, routedAt, climateSignal: null, demo: true });
    l.entries.push(await appendEntry(l.entries, rec));
    n++;
  }
  save(l);
  await verify();
}

async function append(path: string) {
  const l = load();
  const o = JSON.parse(readFileSync(path, "utf8"));
  const lotId = o.lotId ?? `KLR-2026-${String(l.entries.length + 1).padStart(4, "0")}`;
  const rec = await makeRecord({ climateSignal: null, demo: false, routedAt: new Date().toISOString(), ...o, lotId });
  try {
    l.entries.push(await appendEntry(l.entries, rec));
  } catch (e) {
    console.error((e as Error).message);
    process.exit(2);
  }
  save(l);
  await verify();
}

async function selftest() {
  // 1. fallback SHA-256 agrees with Web Crypto
  const samples = ["", "abc", "a".repeat(1000), "किसान सेतु", JSON.stringify(load().entries)];
  for (const t of samples) {
    const a = await sha256Hex(t);
    const b = sha256Fallback(new TextEncoder().encode(t));
    if (a !== b) { console.error("sha256 fallback mismatch"); process.exit(1); }
  }
  if ((await sha256Hex("abc")) !== "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad") { console.error("sha256 known answer failed"); process.exit(1); }
  // 2. tampering one field breaks the chain
  const l = load();
  const forged = structuredClone(l.entries);
  forged[1].record.tonnes += 1;
  if ((await verifyChain(forged)).ok) { console.error("tamper not detected"); process.exit(1); }
  // 3. the duplicate guard rejects the same lot
  const { lotKey: _k, ...again } = l.entries[0].record;
  void _k;
  try { await appendEntry(l.entries, { ...again, lotId: "DUP" }); console.error("duplicate accepted"); process.exit(1); } catch { /* expected */ }
  // 4. canonical form ignores key order
  if (canonical({ b: 1, a: [2, { d: 3, c: 4 }] }) !== canonical({ a: [2, { c: 4, d: 3 }], b: 1 })) { console.error("canonical order"); process.exit(1); }
  console.log("selftest ok: sha256 fallback, tamper detection, duplicate guard, canonical JSON");
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === "verify") await verify();
else if (cmd === "selftest") await selftest();
else if (cmd === "seed") await seed();
else if (cmd === "append" && arg) await append(arg);
else {
  console.error("usage: ledger.mts verify | selftest | seed | append <lot.json>");
  process.exit(1);
}
