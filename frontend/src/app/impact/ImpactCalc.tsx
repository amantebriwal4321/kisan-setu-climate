"use client";

import { useState } from "react";
import { factorFor, co2eKg, type FactorSet } from "@/lib/climate/factors";

type Row = { slug: string; name: string; risk: number; kgRoutable: number };

const SETS: { id: FactorSet; label: string }[] = [
  { id: "crop", label: "Crop factors" },
  { id: "conservative", label: "Conservative" },
  { id: "fao", label: "FAO average" },
];

export default function ImpactCalc({ rows }: { rows: Row[] }) {
  const [set, setSet] = useState<FactorSet>("crop");
  const total = rows.reduce((a, r) => a + co2eKg(r.kgRoutable / 1000, factorFor(r.slug, set).ef), 0);
  return (
    <div className="card p-5 mt-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <div className="eyebrow mb-1">This week, Kolar demo series</div>
          <div style={{ fontSize: 14 }}>Surplus the nearby units can absorb, by crop at WATCH or HIGH risk</div>
        </div>
        <div className="flex gap-1.5">
          {SETS.map((s) => (
            <button key={s.id} onClick={() => setSet(s.id)} className="pill" style={{ cursor: "pointer", fontSize: 12, padding: "4px 10px", border: "none", fontWeight: 600, background: set === s.id ? "var(--ink)" : "var(--dash-bg)", color: set === s.id ? "#fff" : "var(--ink)" }}>{s.label}</button>
          ))}
        </div>
      </div>
      <table style={{ width: "100%", fontSize: 13.5, borderCollapse: "collapse" }}>
        <thead><tr className="faint" style={{ textAlign: "left", fontSize: 12 }}><th style={{ padding: 6 }}>Crop</th><th style={{ padding: 6 }}>Risk</th><th style={{ padding: 6 }}>Routable</th><th style={{ padding: 6 }}>EF</th><th style={{ padding: 6 }}>CO2e kept out of waste</th></tr></thead>
        <tbody>
          {rows.map((r) => {
            const f = factorFor(r.slug, set);
            return (
              <tr key={r.slug} style={{ borderTop: "1px solid var(--dash-line)" }}>
                <td style={{ padding: 6, fontWeight: 600 }}>{r.name}</td>
                <td style={{ padding: 6 }}>{r.risk}</td>
                <td style={{ padding: 6 }}>{r.kgRoutable.toLocaleString("en-IN")} kg</td>
                <td className="mono" style={{ padding: 6 }}>{f.ef}</td>
                <td className="mono" style={{ padding: 6 }}>{co2eKg(r.kgRoutable / 1000, f.ef).toLocaleString("en-IN")} kg</td>
              </tr>
            );
          })}
          <tr style={{ borderTop: "2px solid var(--ink)" }}>
            <td style={{ padding: 6, fontWeight: 700 }} colSpan={4}>Total</td>
            <td className="mono" style={{ padding: 6, fontWeight: 700, color: "var(--brand-deep)" }}>{total.toLocaleString("en-IN")} kg CO2e</td>
          </tr>
        </tbody>
      </table>
      <p className="faint" style={{ fontSize: 12, marginTop: 8 }}>
        {factorFor("tomato", set).label}. Source: {factorFor("tomato", set).source}.
      </p>
    </div>
  );
}
