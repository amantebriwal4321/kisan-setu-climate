"use client";

import { useEffect, useMemo, useState } from "react";
import QRCodeView from "@/components/QRCodeView";
import { appendEntry, farmerRef } from "@/lib/ledger/core.mjs";
import type { LedgerEntry, LotRecord } from "@/lib/ledger/core.d.mts";
import { toB64Url } from "@/lib/ledger/b64";
import { factorFor, co2eKg, SOURCES } from "@/lib/climate/factors";
import type { Match, FarmerRecord } from "@/lib/engine";

const LOCAL_KEY = "ks-ledger-local-v1";

function loadLocal(): LedgerEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

// Anchors a lot in this browser, chained onto the public ledger head. The QR carries
// the full entry, so any phone can recompute the hash without a database.
export default function IssuePassport({
  publicEntries, crop, cropName, matches, farmers, riskScore, climateSignal, qrBase,
}: {
  publicEntries: LedgerEntry[]; crop: string; cropName: string; matches: Match[]; farmers: FarmerRecord[];
  riskScore: number; climateSignal: number | null; qrBase: string;
}) {
  const [local, setLocal] = useState<LedgerEntry[]>([]);
  const [farmerId, setFarmerId] = useState(farmers[0]?.farmerId ?? "");
  const [unitSlug, setUnitSlug] = useState(matches[0]?.unitSlug ?? "");
  const [tonnes, setTonnes] = useState(1.5);
  const [harvestDate, setHarvestDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [last, setLast] = useState<LedgerEntry | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => setLocal(loadLocal()), []);
  useEffect(() => { setFarmerId(farmers[0]?.farmerId ?? ""); setUnitSlug(matches[0]?.unitSlug ?? ""); setLast(null); setMsg(null); }, [crop, farmers, matches]);

  const unit = matches.find((m) => m.unitSlug === unitSlug) ?? matches[0];
  const f = factorFor(crop, "crop");
  const chain = useMemo(() => [...publicEntries, ...local], [publicEntries, local]);

  async function anchor() {
    const farmer = farmers.find((x) => x.farmerId === farmerId);
    if (!farmer || !unit) return;
    const rec: Omit<LotRecord, "lotKey"> = {
      v: 1,
      lotId: `KLR-LOCAL-${String(local.length + 1).padStart(3, "0")}`,
      crop, cropName, tonnes,
      district: "Kolar, Karnataka",
      village: farmer.village,
      farmerRef: await farmerRef(farmer.farmerId),
      unit: unit.unitSlug,
      unitName: unit.unitName,
      product: unit.products?.[0] ?? "paste",
      harvestDate,
      routedAt: new Date().toISOString(),
      riskScore, climateSignal,
      efKgCo2ePerKg: f.ef,
      efSource: SOURCES.poore.short,
      co2eAvoidedKg: co2eKg(tonnes, f.ef),
      demo: true,
    };
    try {
      const e = await appendEntry(chain, rec);
      const next = [...local, e];
      localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      setLocal(next);
      setLast(e);
      setMsg({ ok: true, text: `Anchored ${e.record.lotId}. ${e.record.co2eAvoidedKg.toLocaleString("en-IN")} kg CO2e at ${f.ef} kg per kg.` });
    } catch (err) {
      setMsg({ ok: false, text: `Rejected. ${(err as Error).message}. Same farmer, crop, harvest date and unit means the same lot, so it is not counted twice.` });
    }
  }

  function reset() {
    localStorage.removeItem(LOCAL_KEY);
    setLocal([]);
    setLast(null);
    setMsg(null);
  }

  const verifyUrl = last ? `${qrBase}/passport/verify?p=${toB64Url(JSON.stringify(last))}` : "";

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="eyebrow mb-1">Surplus lot passport</div>
          <h3 className="display" style={{ fontSize: 18, fontWeight: 700 }}>Anchor a rescued {cropName.toLowerCase()} lot</h3>
        </div>
        {local.length > 0 && <button className="btn btn-sm" onClick={reset} style={{ fontSize: 12 }}>Clear browser lots ({local.length})</button>}
      </div>
      <p className="faint" style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
        Chained onto the public ledger head ({publicEntries.at(-1)?.hash.slice(0, 10)}…). Browser lots stay on this device until exported with <span className="mono">scripts/ledger.mts append</span>.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" style={{ fontSize: 13 }}>
        <label className="flex flex-col gap-1">Farmer
          <select value={farmerId} onChange={(e) => setFarmerId(e.target.value)} className="panel p-2">
            {farmers.slice(0, 25).map((x) => <option key={x.farmerId} value={x.farmerId}>{x.farmerId} · {x.village}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">Unit
          <select value={unitSlug} onChange={(e) => setUnitSlug(e.target.value)} className="panel p-2">
            {matches.map((m) => <option key={m.unitSlug} value={m.unitSlug}>{m.unitName}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">Tonnes
          <input type="number" min={0.1} step={0.1} value={tonnes} onChange={(e) => setTonnes(Math.max(0.1, Math.round(Number(e.target.value) * 10) / 10))} className="panel p-2" />
        </label>
        <label className="flex flex-col gap-1">Harvest date
          <input type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} className="panel p-2" />
        </label>
      </div>
      <div className="flex items-center gap-3 mt-4 flex-wrap">
        <button className="btn btn-primary" onClick={anchor} disabled={!unit}>Anchor lot →</button>
        <span className="faint" style={{ fontSize: 12.5 }}>
          {co2eKg(tonnes, f.ef).toLocaleString("en-IN")} kg CO2e at {f.ef} kg/kg ({f.label})
        </span>
      </div>
      {msg && (
        <div className="panel p-3 mt-3" style={{ borderColor: msg.ok ? "var(--brand)" : "var(--alarm)", fontSize: 13.5, fontWeight: 600, color: msg.ok ? "var(--brand-deep)" : "var(--alarm)" }}>
          {msg.ok ? "✓ " : "✗ "}{msg.text}
        </div>
      )}
      {last && (
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <QRCodeView url={verifyUrl} size={190} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="mono" style={{ fontSize: 11.5, wordBreak: "break-all" }}>hash {last.hash}</div>
            <div className="mono faint" style={{ fontSize: 11.5, wordBreak: "break-all" }}>prev {last.prevHash}</div>
            <a href={verifyUrl} target="_blank" rel="noreferrer" className="btn btn-sm mt-3" style={{ fontSize: 12, display: "inline-flex" }}>Open verify page ↗</a>
          </div>
        </div>
      )}
    </div>
  );
}
