// Transparent price trend indicator. Handles both price crashes (▼ drop %) and rising prices (▲ rise %)
export default function PriceDrop({
  were,
  now,
  risk,
}: {
  were: number;
  now: number;
  risk: number;
}) {
  const isRising = now >= were;
  const pctChange = Math.abs(Math.round(((now - were) / were) * 100));
  const drop = Math.round(((were - now) / were) * 100);
  const riskColor = risk >= 66 ? "var(--alarm)" : risk >= 40 ? "var(--watch)" : "var(--brand-deep)";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <div className="faint" style={{ fontSize: 12 }}>A month ago</div>
          <div className="kpi-num" style={{ fontSize: 24, color: "var(--ink-3)", textDecoration: isRising ? "none" : "line-through" }}>
            ₹{were}
          </div>
        </div>

        {isRising ? (
          <svg width="30" height="24" viewBox="0 0 30 24" fill="none" stroke="var(--brand-deep)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 16l11-10 11 10" />
          </svg>
        ) : (
          <svg width="30" height="24" viewBox="0 0 30 24" fill="none" stroke="var(--alarm)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 8l11 10 11-10" />
          </svg>
        )}

        <div>
          <div className="faint" style={{ fontSize: 12 }}>Today</div>
          <div className="kpi-num" style={{ fontSize: 30, color: isRising ? "var(--brand-deep)" : "var(--alarm-text)" }}>
            ₹{now}<span style={{ fontSize: 14 }}>/kg</span>
          </div>
        </div>

        {isRising ? (
          <div className="badge badge-stable" style={{ fontSize: 14, padding: "6px 12px", background: "#dcfce7", color: "#166534", border: "1px solid #86efac" }}>
            ▲ +{pctChange}% Price Rising
          </div>
        ) : (
          <div className="badge badge-high" style={{ fontSize: 14, padding: "6px 12px" }}>
            ▼ {drop}% Crash Drop
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="faint" style={{ fontSize: 12 }}>
            {isRising ? "Crash Risk Index (Safe / High Demand)" : "Crash risk"}
          </span>
          <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: riskColor }}>
            {Math.round(risk)}/100 {isRising ? "· STABLE" : ""}
          </span>
        </div>
        <div style={{ height: 10, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" }}>
          <div style={{ width: `${Math.max(8, risk)}%`, height: "100%", background: riskColor, borderRadius: 999, transition: "width 0.3s ease" }} />
        </div>
      </div>
    </div>
  );
}
