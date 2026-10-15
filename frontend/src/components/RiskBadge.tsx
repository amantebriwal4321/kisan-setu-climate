import type { RiskLabel } from "@/lib/engine";

const CLASS: Record<RiskLabel, string> = {
  HIGH: "badge badge-high",
  WATCH: "badge badge-watch",
  STABLE: "badge badge-stable",
};
const TEXT: Record<RiskLabel, string> = {
  HIGH: "Crash risk high",
  WATCH: "Watch",
  STABLE: "Stable",
};

export default function RiskBadge({ label }: { label: RiskLabel }) {
  return (
    <span className={CLASS[label]}>
      <span className="badge-dot" />
      {TEXT[label]}
    </span>
  );
}

export function riskColor(label: RiskLabel) {
  return label === "HIGH" ? "var(--alarm)" : label === "WATCH" ? "var(--watch)" : "var(--brand)";
}
