export default function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="card p-5">
      <div className="eyebrow">{label}</div>
      <div className="kpi-num mt-2" style={{ fontSize: 30, color: accent || "var(--ink)", lineHeight: 1.05 }}>
        {value}
      </div>
      {sub && <div className="muted mt-1" style={{ fontSize: 13 }}>{sub}</div>}
    </div>
  );
}
