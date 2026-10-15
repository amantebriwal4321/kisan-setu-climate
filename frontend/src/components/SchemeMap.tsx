import React from "react";

type SchemeRow = {
  piece: string;
  scheme: string;
  sourceUrl?: string;
  status: "LIVE" | "PUBLIC DATA" | "REAL SCHEME" | "PITCHED (SANDBOX)";
  gap: string;
};

const ROWS: SchemeRow[] = [
  {
    piece: "Mandi prices & price drop detection",
    scheme: "Agmarknet (data.gov.in API)",
    sourceUrl: "https://data.gov.in",
    status: "LIVE",
    gap: "Data.gov.in free tier provides daily modal prices; historical arrivals have rate-limits, so we cache district baselines.",
  },
  {
    piece: "District crop area & glut context",
    scheme: "NDSAP + Karnataka Crop Survey Portal",
    sourceUrl: "https://cropsurvey.karnataka.gov.in",
    status: "PUBLIC DATA",
    gap: "Real historical district×season production; public data is aggregate, so farm-level sowing requires the AgriStack registry.",
  },
  {
    piece: "Farmer identity & crop-sown targeting",
    scheme: "AgriStack Farmer + Crop Sown Registry (UFSI API)",
    sourceUrl: "https://ufsi.agristack.gov.in",
    status: "PITCHED (SANDBOX)",
    gap: "10.31 cr Farmer IDs created nationally. Production requires DPI Consent Manager & Authorised Entity onboarding; demo uses an exact AgriStack-schema CSV seed.",
  },
  {
    piece: "Human middle layer (zero-tech farmers)",
    scheme: "Krishi Sakhi (KSCP) / CSC VLE / KVK",
    status: "REAL SCHEME",
    gap: "70,000 trained women para-extension workers active (Karnataka Phase 1). Production needs District Agriculture Dept MoU to assign task rosters.",
  },
  {
    piece: "Surplus processing & aggregation",
    scheme: "PMFME (MoFPI) & Operation Greens",
    status: "REAL SCHEME",
    gap: "Schemes subsidise rural processing units. District administration maintains unit capacity manifests, but lacked dynamic surplus dispatch.",
  },
  {
    piece: "Village collection hubs & transport",
    scheme: "10,000 FPO Scheme (SFAC / NABARD)",
    status: "REAL SCHEME",
    gap: "FPO aggregation centers exist in Kolar; needs digitized collection-point route management.",
  },
  {
    piece: "Zero-internet voice alert call (IVR)",
    scheme: "Kisan Call Centre (1800-180-1551) / Cloud IVR",
    status: "PITCHED (SANDBOX)",
    gap: "Tested via browser Web Speech API + keypad emulation in the demo; production hooks into an enterprise IVR gateway (e.g. Exotel / Bhashini TTS).",
  },
];

export default function SchemeMap() {
  return (
    <div className="card p-6 md:p-8" id="schemes">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="eyebrow">Government Infrastructure Mapping & Honest Gaps</div>
          <h3 className="display" style={{ fontSize: "clamp(20px, 3vw, 26px)", fontWeight: 700, marginTop: 4 }}>
            How Kisan Setu Plugs into Real Indian Public Digital Infrastructure
          </h3>
        </div>
        <a
          href="/data/farmers.csv"
          download="agristack_seed_farmers.csv"
          className="btn"
          style={{ fontSize: 13 }}
        >
          📥 Download AgriStack Seed CSV
        </a>
      </div>

      <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.55, marginBottom: 20, maxWidth: 840 }}>
        Every layer of Kisan Setu is intentionally mapped to an active Indian government programme. We do not invent proprietary data silos. Here is the verified status of each integration and the honest operational gaps to production.
      </p>

      <div className="overflow-x-auto">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border)", background: "var(--dash-bg)" }}>
              <th style={{ padding: "12px 14px", fontWeight: 700 }}>System Piece</th>
              <th style={{ padding: "12px 14px", fontWeight: 700 }}>Real Government Scheme / Digital Public Good</th>
              <th style={{ padding: "12px 14px", fontWeight: 700 }}>Status in Demo</th>
              <th style={{ padding: "12px 14px", fontWeight: 700 }}>Honest Production Gap</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--dash-line)" }}>
                <td style={{ padding: "12px 14px", fontWeight: 600 }}>{r.piece}</td>
                <td style={{ padding: "12px 14px" }}>
                  {r.sourceUrl ? (
                    <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="link">
                      {r.scheme} ↗
                    </a>
                  ) : (
                    <span>{r.scheme}</span>
                  )}
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <StatusBadge status={r.status} />
                </td>
                <td style={{ padding: "12px 14px", color: "var(--ink-2)", fontSize: 13, lineHeight: 1.45 }}>
                  {r.gap}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: SchemeRow["status"] }) {
  const styles: Record<SchemeRow["status"], { bg: string; color: string; border: string }> = {
    "LIVE": { bg: "#dcfce7", color: "#15803d", border: "#86efac" },
    "PUBLIC DATA": { bg: "#e0e7ff", color: "#4338ca", border: "#a5b4fc" },
    "REAL SCHEME": { bg: "#fef3c7", color: "#b45309", border: "#fcd34d" },
    "PITCHED (SANDBOX)": { bg: "#f3e8ff", color: "#7e22ce", border: "#d8b4fe" },
  };
  const s = styles[status];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}
