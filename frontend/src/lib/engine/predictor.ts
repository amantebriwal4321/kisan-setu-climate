// Transparent, rule-based crash-risk predictor (ported from backend/app/predictor.py).
// The Lambda copy lives in aws/lambda/risk/score.mjs. Keep the two in step.
// aws/scripts/check-risk-parity.mjs checks them.
// We never predict a future price — only a 0-100 "how likely is a crash right now" score
// from three stated signals combined with fixed, public weights.

export const W_ARRIVALS = 0.45;
export const W_PRICE = 0.4;
export const W_SEASON = 0.15;

const SEASON_BASELINE_DAYS = 14;
const PRICE_LOOKBACK = 7;
const ARRIVALS_FULL_JUMP = 2.0; // arrivals at 3x the early-season baseline = full signal
const PRICE_FULL_DROP = 0.3; // a 30% fall over 7 days = full signal

export type Row = { date: string; month: number; price: number; arrivals: number };
export type RiskPoint = {
  date: string;
  score: number;
  arrivalsSignal: number;
  priceSignal: number;
  seasonSignal: number;
};

const clamp = (x: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, x));
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const r1 = (x: number) => Math.round(x * 10) / 10;

function arrivalsSignal(arrivals: number[], i: number, baseline: number) {
  if (baseline <= 0) return 0;
  const ratio = arrivals[i] / baseline;
  return clamp(((ratio - 1) / ARRIVALS_FULL_JUMP) * 100);
}

function priceSignal(prices: number[], i: number) {
  let j = i - PRICE_LOOKBACK;
  if (j < 0) j = 0;
  if (i === 0 || prices[j] <= 0) return 0;
  const pct = (prices[i] - prices[j]) / prices[j]; // negative when falling
  if (pct >= 0) return 0;
  return clamp((-pct / PRICE_FULL_DROP) * 100);
}

export function computeRiskSeries(rows: Row[], harvestMonths: number[]): RiskPoint[] {
  const prices = rows.map((r) => r.price);
  const arrivals = rows.map((r) => r.arrivals);
  const baseline = mean(arrivals.slice(0, SEASON_BASELINE_DAYS));
  return rows.map((r, i) => {
    const a = arrivalsSignal(arrivals, i, baseline);
    const p = priceSignal(prices, i);
    const s = harvestMonths.includes(r.month) ? 100 : 0;
    const score = clamp(W_ARRIVALS * a + W_PRICE * p + W_SEASON * s);
    return { date: r.date, score: r1(score), arrivalsSignal: r1(a), priceSignal: r1(p), seasonSignal: r1(s) };
  });
}

export type RiskLabel = "HIGH" | "WATCH" | "STABLE";
export function riskLabel(score: number): RiskLabel {
  if (score >= 66) return "HIGH";
  if (score >= 40) return "WATCH";
  return "STABLE";
}
