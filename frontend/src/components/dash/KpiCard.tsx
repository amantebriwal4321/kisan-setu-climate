import type { ReactNode } from "react";

// KPI card styled after the reference: big bold number, small caption, circular icon
// top-right. `filled` makes it the solid-green hero card.
export default function KpiCard({
  label,
  value,
  caption,
  icon,
  filled,
}: {
  label: string;
  value: string;
  caption?: string;
  icon?: ReactNode;
  filled?: boolean;
}) {
  const cardStyle: React.CSSProperties = filled
    ? { background: "var(--brand)", color: "#fff", border: "1px solid var(--brand-deep)" }
    : { background: "#fff", color: "var(--ink)", border: "1px solid var(--dash-line)" };
  return (
    <div style={{ ...cardStyle, borderRadius: 18, padding: 20, boxShadow: "0 1px 2px rgba(20,35,26,.04)" }}>
      <div className="flex items-start justify-between">
        <span style={{ fontSize: 13, fontWeight: 600, opacity: filled ? 0.85 : 0.6 }}>{label}</span>
        <span style={{
          width: 30, height: 30, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
          background: filled ? "rgba(255,255,255,.18)" : "var(--brand-soft)", color: filled ? "#fff" : "var(--brand-deep)",
        }}>
          {icon ?? <Arrow />}
        </span>
      </div>
      <div className="kpi-num" style={{ fontSize: 34, marginTop: 14, lineHeight: 1 }}>{value}</div>
      {caption && (
        <div style={{ fontSize: 12.5, marginTop: 10, opacity: filled ? 0.85 : 0.55, display: "flex", alignItems: "center", gap: 5 }}>
          {caption}
        </div>
      )}
    </div>
  );
}

function Arrow() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  );
}
