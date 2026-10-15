import type { ClimateSignal } from "@/lib/climate/openMeteo";
import { SOURCES } from "@/lib/climate/factors";

// The fourth risk signal, live from Open-Meteo, with its inputs on screen.
export default function ClimateCard({ climate }: { climate: ClimateSignal }) {
  if (!climate.ok) {
    return (
      <div className="panel p-3 mt-4" style={{ fontSize: 13 }}>
        <div className="eyebrow mb-1">Climate shock signal · 15%</div>
        Open-Meteo did not answer ({climate.error}). The score falls back to the three market signals.
      </div>
    );
  }
  const c = climate;
  return (
    <div className="panel p-3 mt-4" style={{ fontSize: 13, lineHeight: 1.5 }}>
      <div className="flex items-baseline justify-between mb-1">
        <div className="eyebrow">Climate shock signal · 15%</div>
        <span className="mono" style={{ fontWeight: 700 }}>{Math.round(c.signal)} / 100</span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" }}>
        <div style={{ width: `${c.signal}%`, height: "100%", background: "var(--alarm)", borderRadius: 999 }} />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div>
          <b>Rain</b> {c.recentRainMm} mm vs {c.baselineRainMm} mm normal ({c.rainRatio}x) <span className="faint">signal {Math.round(c.rainSignal)}</span>
        </div>
        <div>
          <b>Heat</b> max {c.recentTmaxC} °C vs {c.baselineTmaxC} °C ({c.tmaxAnomalyC >= 0 ? "+" : ""}{c.tmaxAnomalyC} °C) <span className="faint">signal {Math.round(c.heatSignal)}</span>
        </div>
      </div>
      <div className="faint" style={{ fontSize: 11.5, marginTop: 4 }}>
        Window {c.window.start} to {c.window.end} (14 days observed, 7 forecast) vs the same days in {c.baselineYears} previous years.{" "}
        Source: <a href={SOURCES.openMeteo.url} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>Open-Meteo</a>.
      </div>
    </div>
  );
}
