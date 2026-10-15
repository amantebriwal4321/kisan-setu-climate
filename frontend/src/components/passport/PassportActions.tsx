"use client";

import { useState } from "react";
import { verifyChain, entryHash } from "@/lib/ledger/core.mjs";
import type { LedgerEntry } from "@/lib/ledger/core.d.mts";

type Step = { label: string; ok: boolean; detail: string };

// Three buttons a buyer or auditor can press. All of the hashing happens in this
// browser with Web Crypto, so nobody has to trust our server for the answer.
export default function PassportActions({ chain, lotId }: { chain: LedgerEntry[]; lotId: string }) {
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [tamper, setTamper] = useState<Step[] | null>(null);
  const [dup, setDup] = useState<{ status: number; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const idx = chain.findIndex((e) => e.record.lotId === lotId);
  const upto = chain.slice(0, idx + 1);
  const entry = chain[idx];

  async function verify() {
    setBusy(true);
    const v = await verifyChain(upto);
    const me = v.results[v.results.length - 1];
    setSteps([
      { label: "Record hash recomputed in this browser", ok: me.hashOk, detail: me.recomputed },
      { label: "Links to the previous lot", ok: me.linkOk, detail: entry.prevHash },
      { label: "Duplicate guard key matches the record", ok: me.keyOk, detail: entry.record.lotKey },
      { label: `Every earlier lot (${upto.length - 1}) still checks out`, ok: v.results.slice(0, -1).every((r) => r.hashOk && r.linkOk && r.keyOk), detail: `${upto.length} entries walked from genesis` },
    ]);
    setBusy(false);
  }

  async function tamperTest() {
    setBusy(true);
    const forged = { ...entry.record, tonnes: Math.round((entry.record.tonnes + 1) * 10) / 10, co2eAvoidedKg: Math.round((entry.record.tonnes + 1) * 1000 * entry.record.efKgCo2ePerKg) };
    const h = await entryHash(entry.prevHash, forged);
    setTamper([
      { label: `Change tonnes ${entry.record.tonnes} to ${forged.tonnes} and rehash`, ok: h === entry.hash, detail: h },
      { label: "Stored hash", ok: true, detail: entry.hash },
    ]);
    setBusy(false);
  }

  async function dupTest() {
    setBusy(true);
    const { lotId: _id, lotKey: _k, ...rest } = entry.record;
    void _id; void _k;
    const res = await fetch("/api/ledger/check", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ record: { ...rest, lotId: "NEW-ATTEMPT" } }),
    });
    const j = await res.json();
    setDup({
      status: res.status,
      text: res.status === 409 ? `Rejected: this farmer, crop, harvest date and unit is already anchored as ${j.duplicateOf}. The waste avoided is counted once.` : `Accepted (no clash found). lotKey ${j.lotKey}`,
    });
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" onClick={verify} disabled={busy}>Verify this lot</button>
        <button className="btn" onClick={tamperTest} disabled={busy}>Tamper test</button>
        <button className="btn" onClick={dupTest} disabled={busy}>Try to log it again</button>
      </div>
      {steps && <Steps title="Verification" steps={steps} />}
      {tamper && (
        <div className="panel p-3" style={{ borderColor: tamper[0].ok ? "var(--alarm)" : "var(--brand)" }}>
          <div className="eyebrow mb-2">Tamper test</div>
          <div style={{ fontSize: 13 }}>{tamper[0].label}</div>
          <div className="mono faint" style={{ fontSize: 11, wordBreak: "break-all", marginTop: 4 }}>forged: {tamper[0].detail}</div>
          <div className="mono faint" style={{ fontSize: 11, wordBreak: "break-all" }}>stored: {tamper[1].detail}</div>
          <p style={{ fontSize: 13, marginTop: 8, fontWeight: 600, color: tamper[0].ok ? "var(--alarm)" : "var(--brand-deep)" }}>
            {tamper[0].ok ? "Unexpected: the forged record matched." : "✓ Mismatch caught. One field changed, so the hash no longer matches and every later link breaks."}
          </p>
        </div>
      )}
      {dup && (
        <div className="panel p-3" style={{ borderColor: dup.status === 409 ? "var(--alarm)" : "var(--brand)", fontSize: 13.5 }}>
          <b>HTTP {dup.status}.</b> {dup.text}
        </div>
      )}
    </div>
  );
}

function Steps({ title, steps }: { title: string; steps: Step[] }) {
  return (
    <div className="panel p-3">
      <div className="eyebrow mb-2">{title}</div>
      <div className="flex flex-col gap-2">
        {steps.map((s, i) => {
          const good = s.ok;
          const mark = s.ok ? "✓" : "✗";
          return (
            <div key={i} style={{ fontSize: 13 }}>
              <span style={{ fontWeight: 700, color: good ? "var(--brand-deep)" : "var(--alarm)" }}>{mark}</span> {s.label}
              <div className="mono faint" style={{ fontSize: 11, wordBreak: "break-all" }}>{s.detail}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
