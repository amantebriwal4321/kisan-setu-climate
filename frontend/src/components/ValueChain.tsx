"use client";

import { STR, type Lang } from "@/lib/i18n";

// Answers the sharpest question a viewer asks: if the mandi is ₹3, why does the unit
// pay the farmer ₹9 at all? Leads with "₹3 is a distress crash, mostly rotting unsold"
// then shows fresh → (processed) → paste, so ₹9 raw is cheap for the unit and a fair
// floor for the farmer. Trilingual on the farmer side; pass lang="en" for the officer.
const CROP_EMOJI: Record<string, string> = { tomato: "🍅", onion: "🧅", beans: "🫛" };

export default function ValueChain({
  crash,
  offer,
  productName,
  productPrice,
  cropSlug,
  lang,
}: {
  crash: number;
  offer: number;
  productName: string;
  productPrice: number;
  cropSlug: string;
  lang: Lang;
}) {
  if (!(productPrice > 0)) return null;
  const t = STR[lang];
  const sc = lang === "hi" ? "deva" : lang === "kn" ? "kn" : "";
  const mult = crash > 0 ? (offer / crash).toFixed(1) : "—";
  const rawIcon = CROP_EMOJI[cropSlug] || "🥬";

  return (
    <div className="panel" style={{ padding: 12 }}>
      <div className={sc} style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.3 }}>{t.whyQ(offer, crash)}</div>

      {/* fresh → (processed) → product */}
      <div style={{ display: "flex", alignItems: "stretch", gap: 6, marginTop: 10 }}>
        <Node icon={rawIcon} price={`₹${crash}`} label={t.chainFresh} tone="bad" className={sc} />
        <Transform />
        <Node icon="🥫" price={`₹${productPrice}`} label={t.chainProcessed(productName)} tone="city" className={sc} />
      </div>

      {/* the farmer's takeaway */}
      <div className={sc} style={{ marginTop: 8, background: "var(--brand-soft)", color: "var(--brand-deep)", borderRadius: 8, padding: "7px 10px", fontWeight: 600, fontSize: 13, textAlign: "center" }}>
        ➜ {t.chainYouGet(offer, mult)}
      </div>

      <p className={`faint ${sc}`} style={{ fontSize: 11.5, lineHeight: 1.5, marginTop: 9 }}>
        {t.winWhy(productName, productPrice, offer)}
      </p>
    </div>
  );
}

function Node({ icon, price, label, tone, className }: { icon: string; price: string; label: string; tone: "bad" | "city"; className?: string }) {
  const color = tone === "bad" ? "var(--alarm-text)" : "var(--ink)";
  return (
    <div style={{ flex: 1, textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 4px" }}>
      <div style={{ fontSize: 20, lineHeight: 1 }}>{icon}</div>
      <div className="kpi-num" style={{ fontSize: 17, color, marginTop: 3 }}>{price}</div>
      <div className={`faint ${className || ""}`} style={{ fontSize: 9.5, marginTop: 2, lineHeight: 1.2 }}>{label}</div>
    </div>
  );
}

// the transformation step between the two prices
function Transform() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 30, color: "var(--ink-3)" }}>
      <div style={{ fontSize: 17, lineHeight: 1 }}>🏭</div>
      <div style={{ fontSize: 13, marginTop: 1 }}>→</div>
    </div>
  );
}
