// Crash-risk scorer used by the Lambda.
// Same weights and thresholds as frontend/src/lib/engine/predictor.ts.
// aws/scripts/check-risk-parity.mjs fails if the two copies drift.

export const W_ARRIVALS = 0.45;
export const W_PRICE = 0.4;
export const W_SEASON = 0.15;

const SEASON_BASELINE_DAYS = 14;
const PRICE_LOOKBACK = 7;
const ARRIVALS_FULL_JUMP = 2.0;
const PRICE_FULL_DROP = 0.3;

const clamp = (x, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, x));
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const r1 = (x) => Math.round(x * 10) / 10;

function arrivalsSignal(arrivals, i, baseline) {
  if (baseline <= 0) return 0;
  const ratio = arrivals[i] / baseline;
  return clamp(((ratio - 1) / ARRIVALS_FULL_JUMP) * 100);
}

function priceSignal(prices, i) {
  let j = i - PRICE_LOOKBACK;
  if (j < 0) j = 0;
  if (i === 0 || prices[j] <= 0) return 0;
  const pct = (prices[i] - prices[j]) / prices[j];
  if (pct >= 0) return 0;
  return clamp((-pct / PRICE_FULL_DROP) * 100);
}

export function computeRiskSeries(rows, harvestMonths) {
  const prices = rows.map((r) => r.price);
  const arrivals = rows.map((r) => r.arrivals);
  const baseline = mean(arrivals.slice(0, SEASON_BASELINE_DAYS));
  const months = harvestMonths || [];
  return rows.map((r, i) => {
    const a = arrivalsSignal(arrivals, i, baseline);
    const p = priceSignal(prices, i);
    const s = months.includes(r.month) ? 100 : 0;
    const score = clamp(W_ARRIVALS * a + W_PRICE * p + W_SEASON * s);
    return {
      date: r.date,
      score: r1(score),
      arrivalsSignal: r1(a),
      priceSignal: r1(p),
      seasonSignal: r1(s),
    };
  });
}

export function riskLabel(score) {
  if (score >= 66) return "HIGH";
  if (score >= 40) return "WATCH";
  return "STABLE";
}
