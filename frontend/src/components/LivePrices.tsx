"use client";

import { useEffect, useState } from "react";

type Row = {
  market: string;
  district: string;
  pricePerKg: number;
  min: number;
  max: number;
  date: string;
  kolar: boolean;
};

export type LivePricesData = {
  live: boolean;
  fetchedAt: string;
  commodity: string;
  rows: Row[];
};

const COMMODITIES = [
  { slug: "tomato", name: "Tomato", emoji: "🍅" },
  { slug: "onion", name: "Onion", emoji: "🧅" },
  { slug: "potato", name: "Potato", emoji: "🥔" },
  { slug: "beans", name: "Beans", emoji: "🫘" },
  { slug: "chilli", name: "Green Chilli", emoji: "🌶️" },
];

export default function LivePrices({
  live,
  selectedCrop,
  onSelectCrop,
}: {
  live: LivePricesData;
  selectedCrop?: string;
  onSelectCrop?: (slug: string) => void;
}) {
  const [data, setData] = useState<LivePricesData>(live);
  const [currentCommodity, setCurrentCommodity] = useState(live.commodity || "Tomato");
  const [loading, setLoading] = useState(false);

  // Sync when parent selectedCrop changes
  useEffect(() => {
    if (!selectedCrop) return;
    const match = COMMODITIES.find((c) => c.slug === selectedCrop);
    if (match && match.name !== currentCommodity) {
      handleSwitch(match.name);
    }
  }, [selectedCrop]);

  function handleSwitch(commodityName: string) {
    setCurrentCommodity(commodityName);
    setLoading(true);
    fetch(`/api/liveprices?commodity=${encodeURIComponent(commodityName)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.rows) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    const item = COMMODITIES.find((c) => c.name.toLowerCase() === commodityName.toLowerCase());
    if (item && onSelectCrop) {
      onSelectCrop(item.slug);
    }
  }

  const { rows, fetchedAt, commodity } = data;
  const isRising = commodity === "Potato" || commodity === "Green Chilli";

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="eyebrow">Live mandi prices · {commodity}</div>
        {data.live ? (
          <span className="badge badge-stable">
            <span className="badge-dot" />
            LIVE · Agmarknet
          </span>
        ) : (
          <span className="pill" style={{ fontSize: 11 }}>
            recent snapshot
          </span>
        )}
      </div>

      <div className="faint" style={{ fontSize: 11.5, marginBottom: 10 }}>
        Karnataka APMC markets · {fetchedAt}
      </div>

      {/* Commodity Switcher Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3.5 pb-2.5" style={{ borderBottom: "1px solid var(--dash-line)" }}>
        {COMMODITIES.map((c) => {
          const active = currentCommodity.toLowerCase() === c.name.toLowerCase();
          return (
            <button
              key={c.slug}
              type="button"
              onClick={() => handleSwitch(c.name)}
              className="pill"
              style={{
                cursor: "pointer",
                background: active ? "var(--brand)" : "var(--dash-bg)",
                color: active ? "#fff" : "var(--ink)",
                border: active ? "1.5px solid var(--brand)" : "1px solid var(--border)",
                fontWeight: active ? 700 : 500,
                fontSize: 11.5,
                padding: "3px 8px",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                transition: "all 0.15s ease",
              }}
            >
              <span>{c.emoji}</span>
              <span>{c.name}</span>
            </button>
          );
        })}
      </div>

      {/* Trend indicator banner */}
      <div
        style={{
          fontSize: 11.5,
          padding: "6px 10px",
          borderRadius: 8,
          marginBottom: 10,
          background: isRising ? "#f0fdf4" : "var(--dash-bg)",
          border: `1px solid ${isRising ? "#86efac" : "var(--border)"}`,
          color: isRising ? "#166534" : "var(--ink-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "between",
        }}
      >
        <span>
          {isRising ? "📈 Prices rising / high demand in Karnataka mandis" : "📉 Crash watch: high supply arriving in regional mandis"}
        </span>
        {loading && <span className="mono faint ml-auto" style={{ fontSize: 10 }}>loading...</span>}
      </div>

      <div className="flex flex-col">
        {rows.map((r, i) => (
          <div
            key={i}
            className="flex items-center justify-between"
            style={{ padding: "7px 0", borderBottom: "1px solid var(--dash-line)" }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.market}
                </span>
                {r.kolar && (
                  <span
                    className="badge badge-stable"
                    style={{ fontSize: 9.5, padding: "1px 7px", flexShrink: 0 }}
                  >
                    Kolar
                  </span>
                )}
              </div>
              <div className="faint" style={{ fontSize: 11 }}>
                {r.district}
              </div>
            </div>
            <div
              className="mono"
              style={{
                fontWeight: 700,
                fontSize: 15,
                flexShrink: 0,
                paddingLeft: 8,
                color: isRising ? "var(--brand-deep)" : undefined,
              }}
            >
              ₹{r.pricePerKg}
              <span className="faint" style={{ fontSize: 11, fontWeight: 400 }}>
                /kg
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="faint" style={{ fontSize: 11, marginTop: 10, lineHeight: 1.5 }}>
        Source: <b>data.gov.in · Agmarknet</b> daily prices. Toggle commodities above to inspect real-time APMC mandi spreads.
      </div>
    </div>
  );
}
