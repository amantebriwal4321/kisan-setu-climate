import type { LotRecord } from "@/lib/ledger/core.d.mts";

const ROWS: { k: keyof LotRecord; label: string; fmt?: (v: unknown, r: LotRecord) => string }[] = [
  { k: "lotId", label: "Lot" },
  { k: "cropName", label: "Crop" },
  { k: "tonnes", label: "Tonnes", fmt: (v) => `${v} t` },
  { k: "village", label: "Village", fmt: (v, r) => `${v}, ${r.district}` },
  { k: "farmerRef", label: "Farmer ref (hashed)" },
  { k: "unitName", label: "Processing unit" },
  { k: "product", label: "Product" },
  { k: "harvestDate", label: "Harvest date" },
  { k: "routedAt", label: "Routed at" },
  { k: "riskScore", label: "Crash risk at routing", fmt: (v) => `${v} / 100` },
  { k: "climateSignal", label: "Climate signal at routing", fmt: (v) => (v === null ? "not recorded" : `${v} / 100`) },
  { k: "efKgCo2ePerKg", label: "Emission factor", fmt: (v) => `${v} kg CO2e per kg` },
  { k: "co2eAvoidedKg", label: "CO2e kept out of waste", fmt: (v) => `${Number(v).toLocaleString("en-IN")} kg` },
  { k: "efSource", label: "Factor source" },
  { k: "lotKey", label: "Duplicate guard key" },
];

export default function RecordTable({ record }: { record: LotRecord }) {
  return (
    <table style={{ width: "100%", fontSize: 13.5, borderCollapse: "collapse" }}>
      <tbody>
        {ROWS.map((row) => {
          const v = record[row.k];
          const text = row.fmt ? row.fmt(v, record) : String(v);
          const isHash = row.k === "lotKey" || row.k === "farmerRef";
          return (
            <tr key={row.k} style={{ borderBottom: "1px solid var(--dash-line)" }}>
              <td className="faint" style={{ padding: "7px 10px 7px 0", whiteSpace: "nowrap", verticalAlign: "top" }}>{row.label}</td>
              <td className={isHash ? "mono" : ""} style={{ padding: "7px 0", wordBreak: "break-all", fontWeight: row.k === "lotId" ? 700 : 500 }}>{text}</td>
            </tr>
          );
        })}
        {record.demo && (
          <tr>
            <td className="faint" style={{ padding: "7px 10px 7px 0" }}>Status</td>
            <td style={{ padding: "7px 0" }}>Demo lot built from the seeded Kolar series</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
