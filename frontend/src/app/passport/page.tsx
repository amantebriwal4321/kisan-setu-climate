import type { Metadata } from "next";
import Link from "next/link";
import DashShell from "@/components/dash/DashShell";
import ChainVerify from "@/components/passport/ChainVerify";
import { LEDGER, LEDGER_FILE_URL, LEDGER_HISTORY_URL, ledgerTotals } from "@/lib/ledger/data";

export const metadata: Metadata = { title: "Lot passports | Kisan Setu" };

export default function Page() {
  const t = ledgerTotals();
  return (
    <DashShell title="Surplus lot passports" subtitle="Every rescued lot gets a record, a SHA-256 hash chained to the one before it, and a QR anyone can verify." active="passport">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Lots anchored" value={String(t.lots)} />
        <Kpi label="Tonnes rerouted" value={`${t.tonnes} t`} />
        <Kpi label="CO2e kept out of waste" value={`${t.co2eKg.toLocaleString("en-IN")} kg`} />
        <Kpi label="Chain head" value={t.head.slice(0, 12) + "…"} mono />
      </section>

      <div className="card p-5 mt-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div style={{ maxWidth: 640 }}>
            <div className="eyebrow mb-1">How it works</div>
            <p style={{ fontSize: 14, lineHeight: 1.55 }}>
              <span className="mono">hash = sha256(prevHash + canonical(record))</span>. Change one field in any lot and its hash breaks, and so does every link after it.
              A <b>duplicate guard key</b> (farmer ref, crop, harvest date, unit) stops the same lot being logged twice, so waste avoided is never double counted.
              The ledger file is committed to the public repo, so its <a href={LEDGER_HISTORY_URL} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>git history</a> is an append only witness.
              This is a hash chain, not a blockchain. There is no wallet and no token.
            </p>
          </div>
          <ChainVerify entries={LEDGER.entries} />
        </div>
      </div>

      <div className="card p-5 mt-5" style={{ overflowX: "auto" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="eyebrow">Ledger</div>
          <a href={LEDGER_FILE_URL} target="_blank" rel="noreferrer" className="faint" style={{ fontSize: 12.5, textDecoration: "underline" }}>ledger.json on GitHub</a>
        </div>
        <table style={{ width: "100%", fontSize: 13.5, borderCollapse: "collapse" }}>
          <thead>
            <tr className="faint" style={{ textAlign: "left", fontSize: 12 }}>
              <th style={{ padding: 6 }}>Lot</th><th style={{ padding: 6 }}>Crop</th><th style={{ padding: 6 }}>Tonnes</th>
              <th style={{ padding: 6 }}>Unit</th><th style={{ padding: 6 }}>Product</th><th style={{ padding: 6 }}>CO2e</th><th style={{ padding: 6 }}>Hash</th>
            </tr>
          </thead>
          <tbody>
            {LEDGER.entries.map((e) => (
              <tr key={e.hash} style={{ borderTop: "1px solid var(--dash-line)" }}>
                <td style={{ padding: 6, fontWeight: 700 }}><Link href={`/passport/${e.record.lotId}`} style={{ textDecoration: "underline" }}>{e.record.lotId}</Link></td>
                <td style={{ padding: 6 }}>{e.record.cropName}</td>
                <td style={{ padding: 6 }}>{e.record.tonnes}</td>
                <td style={{ padding: 6 }}>{e.record.unitName}</td>
                <td style={{ padding: 6 }}>{e.record.product}</td>
                <td style={{ padding: 6 }}>{e.record.co2eAvoidedKg.toLocaleString("en-IN")} kg</td>
                <td className="mono faint" style={{ padding: 6, fontSize: 11.5 }}>{e.hash.slice(0, 16)}…</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="faint" style={{ fontSize: 12, marginTop: 10 }}>{LEDGER.note}</p>
      </div>
    </DashShell>
  );
}

function Kpi({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="card p-4">
      <div className="faint" style={{ fontSize: 12 }}>{label}</div>
      <div className={mono ? "mono" : "kpi-num"} style={{ fontSize: mono ? 16 : 24, marginTop: 4, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
