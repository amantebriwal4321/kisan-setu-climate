"use client";

import type { Unit, Match } from "@/lib/engine";

export default function SvgMap({
  district,
  units,
  matched,
  routed,
}: {
  district: { lat: number; lng: number; name: string };
  units: Unit[];
  matched?: Match[];
  routed?: boolean;
}) {
  const W = 640, H = 400, pad = 64;
  const pts = [district, ...units];
  const lats = pts.map((p) => p.lat);
  const lngs = pts.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const spanLat = maxLat - minLat || 0.1, spanLng = maxLng - minLng || 0.1;
  const px = (lng: number) => pad + ((lng - minLng) / spanLng) * (W - 2 * pad);
  const py = (lat: number) => pad + ((maxLat - lat) / spanLat) * (H - 2 * pad);

  const tonnesBy: Record<string, number> = {};
  (matched || []).forEach((m) => { tonnesBy[m.unitSlug] = m.allocatedTonnes; });
  const matchedSlugs = new Set((matched || []).map((m) => m.unitSlug));
  const dcx = px(district.lng), dcy = py(district.lat);

  return (
    <div>
      {/* legend */}
      <div className="flex flex-wrap items-center gap-4 mb-2" style={{ fontSize: 12 }}>
        <span className="inline-flex items-center gap-1.5">
          <span style={{ width: 11, height: 11, borderRadius: 999, background: "var(--alarm)" }} />
          <b>Mandi</b> — crop crashing here
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span style={{ width: 11, height: 11, borderRadius: 999, background: "var(--brand)" }} />
          <b>Processing unit</b> — crop sent here
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`${district.name} district map`}>
        <defs>
          <pattern id="grid" width="34" height="34" patternUnits="userSpaceOnUse">
            <path d="M34 0H0V34" fill="none" stroke="var(--dash-line)" strokeWidth="1" />
          </pattern>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" fill="var(--brand)" />
          </marker>
        </defs>
        <rect x="0" y="0" width={W} height={H} rx="14" fill="#fff" />
        <rect x="1" y="1" width={W - 2} height={H - 2} rx="13" fill="url(#grid)" opacity="0.6" />

        {/* arrows mandi -> unit (only when routed) */}
        {routed && (matched || []).map((m) => {
          const ux = px(m.lng), uy = py(m.lat);
          const dx = ux - dcx, dy = uy - dcy, len = Math.hypot(dx, dy) || 1;
          const ex = ux - (dx / len) * 16, ey = uy - (dy / len) * 16;
          return (
            <line key={"a" + m.unitSlug} x1={dcx} y1={dcy} x2={ex} y2={ey}
              stroke="var(--brand)" strokeWidth="2.2" markerEnd="url(#arrow)" opacity="0.9" />
          );
        })}

        {/* units */}
        {units.map((u) => {
          const active = routed && matchedSlugs.has(u.slug);
          let cx = px(u.lng), cy = py(u.lat);
          // nudge a unit that sits on top of the mandi so its dot + label are readable
          if (Math.hypot(cx - dcx, cy - dcy) < 28) { cx = dcx - 46; cy = dcy + 44; }
          const t = tonnesBy[u.slug];
          return (
            <g key={u.slug}>
              <circle cx={cx} cy={cy} r={active ? 9 : 7} fill={active ? "var(--brand)" : "#fff"} stroke="var(--brand-deep)" strokeWidth="2" />
              <text x={cx} y={cy + 21} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--ink)">{u.name.split(" ")[0]}</text>
              {active && t != null && (
                <text x={cx} y={cy + 34} textAnchor="middle" fontSize="10.5" fill="var(--brand-deep)" className="mono">takes {t} t</text>
              )}
            </g>
          );
        })}

        {/* mandi */}
        <g>
          <circle cx={dcx} cy={dcy} r="16" fill="var(--alarm)" opacity="0.14" />
          <circle cx={dcx} cy={dcy} r="9" fill="var(--alarm)" stroke="#fff" strokeWidth="2.5" />
          <text x={dcx} y={dcy - 18} textAnchor="middle" fontSize="12.5" fontWeight="700" fill="var(--alarm-text)">{district.name} mandi</text>
        </g>
      </svg>

      <p className="muted" style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.45 }}>
        {routed
          ? `The crashing crop at ${district.name} mandi is split and sent to these units to be turned into paste, flakes and pulp.`
          : `${district.name} mandi (red) and the processing units nearby (green). Route the crop to send the surplus to them.`}
      </p>
    </div>
  );
}
