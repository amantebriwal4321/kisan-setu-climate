import type { Metadata } from "next";
import DashShell from "@/components/dash/DashShell";
import ImpactCalc from "./ImpactCalc";
import { getCrops, getMatches } from "@/lib/engine";
import { CROP_FACTORS, CONSERVATIVE_EF, FAO_AVG_EF, SOURCES } from "@/lib/climate/factors";
import { ledgerTotals } from "@/lib/ledger/data";

export const metadata: Metadata = { title: "Climate impact | Kisan Setu" };

export default function Page() {
  const t = ledgerTotals();
  const rows = getCrops()
    .filter((c) => c.risk >= 40)
    .map((c) => ({ slug: c.slug, name: c.name, risk: c.risk, kgRoutable: getMatches(c.slug)?.totals.kgRescued ?? 0 }));
  return (
    <DashShell title="Climate impact" subtitle="Food that is rerouted instead of dumped keeps its production emissions from being wasted. Here is the math, with the source for every factor." active="impact">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Lots anchored" value={String(t.lots)} />
        <Kpi label="Tonnes rerouted (ledger)" value={`${t.tonnes} t`} />
        <Kpi label="CO2e kept out of waste (ledger)" value={`${t.co2eKg.toLocaleString("en-IN")} kg`} accent />
        <Kpi label="Lots counted twice" value="0" caption="duplicate guard" />
      </section>

      <div className="card p-5 mt-5">
        <div className="eyebrow mb-2">The formula</div>
        <p className="mono" style={{ fontSize: 15 }}>CO2e avoided (kg) = tonnes rerouted × 1000 × EF (kg CO2e per kg)</p>
        <p style={{ fontSize: 13.5, lineHeight: 1.55, marginTop: 8 }}>
          EF is the farm to retail greenhouse gas footprint of that crop. When a lot is dumped, those emissions bought nothing.
          When it becomes paste or pickle, they stay in use. This is the same accounting FAO uses for the footprint of food wastage.
          It is an estimate of emissions not wasted, not a measured reduction, and it is not a carbon credit.
        </p>
      </div>

      <ImpactCalc rows={rows} />

      <div className="card p-5 mt-5" style={{ overflowX: "auto" }}>
        <div className="eyebrow mb-2">Emission factors and sources</div>
        <table style={{ width: "100%", fontSize: 13.5, borderCollapse: "collapse" }}>
          <thead><tr className="faint" style={{ textAlign: "left", fontSize: 12 }}><th style={{ padding: 6 }}>Crop</th><th style={{ padding: 6 }}>Source row</th><th style={{ padding: 6 }}>EF, kg CO2e per kg</th></tr></thead>
          <tbody>
            {Object.entries(CROP_FACTORS).map(([k, v]) => (
              <tr key={k} style={{ borderTop: "1px solid var(--dash-line)" }}>
                <td style={{ padding: 6, textTransform: "capitalize" }}>{k}</td><td style={{ padding: 6 }}>{v.row}</td><td className="mono" style={{ padding: 6 }}>{v.ef}</td>
              </tr>
            ))}
            <tr style={{ borderTop: "1px solid var(--dash-line)" }}><td style={{ padding: 6 }}>Conservative, all crops</td><td style={{ padding: 6 }}>Other Vegetables</td><td className="mono" style={{ padding: 6 }}>{CONSERVATIVE_EF}</td></tr>
            <tr style={{ borderTop: "1px solid var(--dash-line)" }}><td style={{ padding: 6 }}>FAO food wastage average</td><td style={{ padding: 6 }}>3.3 Gt CO2e / 1.3 Gt</td><td className="mono" style={{ padding: 6 }}>{FAO_AVG_EF}</td></tr>
          </tbody>
        </table>
        <ul style={{ fontSize: 13, lineHeight: 1.6, marginTop: 12, paddingLeft: 18, listStyle: "disc" }}>
          {[SOURCES.poore, SOURCES.fao, SOURCES.unep, SOURCES.openMeteo].map((s) => (
            <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>{s.short}</a>. {s.note}</li>
          ))}
        </ul>
      </div>

      <div className="card p-5 mt-5">
        <div className="eyebrow mb-2">Limits, said plainly</div>
        <ul style={{ fontSize: 13.5, lineHeight: 1.6, paddingLeft: 18, listStyle: "disc" }}>
          <li>Factors are global means. The tomato value includes heated greenhouse production abroad, so Kolar open field tomatoes are likely lower. Use the conservative set for a lower figure.</li>
          <li>We do not subtract emissions from processing, transport to the unit, or packaging. Those are small next to production but not zero.</li>
          <li>We do not add avoided methane from rotting produce. That would raise the number, so leaving it out keeps it conservative.</li>
          <li>All tonnages come from the seeded Kolar demo series and the demo lots, not from a field survey.</li>
        </ul>
      </div>
    </DashShell>
  );
}

function Kpi({ label, value, caption, accent = false }: { label: string; value: string; caption?: string; accent?: boolean }) {
  return (
    <div className="card p-4">
      <div className="faint" style={{ fontSize: 12 }}>{label}</div>
      <div className="kpi-num" style={{ fontSize: 24, marginTop: 4, fontWeight: 700, color: accent ? "var(--brand-deep)" : undefined }}>{value}</div>
      {caption && <div className="faint" style={{ fontSize: 11 }}>{caption}</div>}
    </div>
  );
}
