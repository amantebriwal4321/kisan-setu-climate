"use client";

import { useEffect, useState } from "react";
import { riskApiUrl, scoreWithLambda, type RemoteRisk, type RiskRow } from "@/lib/riskClient";
import type { RiskLabel } from "@/lib/engine";
import { blendClimate } from "@/lib/climate/openMeteo";

// Shows where the crash score came from. The in-app number stays visible.
// When NEXT_PUBLIC_RISK_API_URL is set, this POSTs the series to API Gateway.
export default function LambdaRisk({
  rows,
  harvestMonths,
  localScore,
  localLabel,
  signals,
  climate = null,
}: {
  rows: RiskRow[];
  harvestMonths: number[];
  localScore: number;
  localLabel: RiskLabel;
  signals: { arrivals: number; price: number; season: number };
  climate?: number | null;
}) {
  const url = riskApiUrl();
  const [remote, setRemote] = useState<RemoteRisk | null>(null);
  const [error, setError] = useState(false);
  const key = JSON.stringify({ harvestMonths, rows });

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setRemote(null);
    setError(false);
    const payload = JSON.parse(key) as { rows: RiskRow[]; harvestMonths: number[] };
    scoreWithLambda(payload)
      .then((r) => { if (!cancelled) setRemote(r); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [url, key]);

  return (
    <div className="panel p-3 mt-4" style={{ fontSize: 13, lineHeight: 1.45 }}>
      <div className="eyebrow mb-1">Score source</div>
      {!url && (
        <p>
          In-app scorer: <b>{localScore}</b> {localLabel}
          {" "}(arrivals {Math.round(signals.arrivals)}, price {Math.round(signals.price)}, season {Math.round(signals.season)}).
          Set <span className="mono">NEXT_PUBLIC_RISK_API_URL</span> to score this series on AWS Lambda.
        </p>
      )}
      {url && !remote && !error && <p>Asking API Gateway + Lambda…</p>}
      {url && error && (
        <p>
          Lambda call failed. Showing the in-app score <b>{localScore}</b> {localLabel}.
        </p>
      )}
      {remote && (
        <p>
          Amazon API Gateway + Lambda: <b>{remote.score}</b> {remote.label}
          {" "}(arrivals {Math.round(remote.arrivalsSignal)}, price {Math.round(remote.priceSignal)}, season {Math.round(remote.seasonSignal)}).
          {" "}In-app score is {localScore} {localLabel}.
        </p>
      )}
      {climate !== null && (
        <p style={{ marginTop: 6 }}>
          Four signal score with climate: <b>{blendClimate(remote ? remote.score : localScore, climate)}</b>
          {" "}= 0.85 × {remote ? "Lambda" : "in-app"} score + 0.15 × climate signal {Math.round(climate)}.
        </p>
      )}
    </div>
  );
}
