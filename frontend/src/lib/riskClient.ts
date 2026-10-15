// Browser client for the Lambda risk API. Calls it only when
// NEXT_PUBLIC_RISK_API_URL is set. Returns null when it is not, so the
// in-app scorer stays on screen.

export type RemoteRisk = {
  score: number;
  label: "HIGH" | "WATCH" | "STABLE";
  arrivalsSignal: number;
  priceSignal: number;
  seasonSignal: number;
  points: number;
  source: "lambda";
};

export type RiskRow = { date: string; month: number; price: number; arrivals: number };

export function riskApiUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_RISK_API_URL;
  if (!raw) return undefined;
  const url = raw.trim().replace(/\/$/, "");
  return url.length > 0 ? url : undefined;
}

export async function scoreWithLambda(input: {
  rows: RiskRow[];
  harvestMonths: number[];
}): Promise<RemoteRisk> {
  const url = riskApiUrl();
  if (!url) throw new Error("NEXT_PUBLIC_RISK_API_URL is not set");
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`risk api ${res.status}`);
  const data = (await res.json()) as Partial<RemoteRisk>;
  if (typeof data.score !== "number" || (data.label !== "HIGH" && data.label !== "WATCH" && data.label !== "STABLE")) {
    throw new Error("risk api payload");
  }
  return {
    score: data.score,
    label: data.label,
    arrivalsSignal: Number(data.arrivalsSignal) || 0,
    priceSignal: Number(data.priceSignal) || 0,
    seasonSignal: Number(data.seasonSignal) || 0,
    points: Number(data.points) || input.rows.length,
    source: "lambda",
  };
}
