const ROWS = [
  { key: "arrivals", label: "Arrivals surge", weight: "45%", hint: "vs a normal season" },
  { key: "price", label: "Price slide", weight: "40%", hint: "last 7 days" },
  { key: "season", label: "Harvest season", weight: "15%", hint: "glut month" },
] as const;

export default function RiskSignals({
  signals,
}: {
  signals: { arrivals: number; price: number; season: number };
}) {
  return (
    <div className="flex flex-col gap-3">
      {ROWS.map((r) => {
        const v = signals[r.key];
        return (
          <div key={r.key}>
            <div className="flex items-baseline justify-between mb-1">
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {r.label} <span className="faint" style={{ fontWeight: 400 }}>· {r.weight}</span>
              </span>
              <span className="mono" style={{ fontSize: 12, color: "var(--ink-2)" }}>{Math.round(v)}</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" }}>
              <div style={{ width: `${v}%`, height: "100%", background: "var(--alarm)", borderRadius: 999 }} />
            </div>
            <div className="faint" style={{ fontSize: 11, marginTop: 3 }}>{r.hint}</div>
          </div>
        );
      })}
    </div>
  );
}
