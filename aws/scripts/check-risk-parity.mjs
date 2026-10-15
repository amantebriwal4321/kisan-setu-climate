// Confirms the Lambda scorer matches the in-app scorer on a fixed series.
// Does not call AWS.

import { computeRiskSeries as lambdaScore, riskLabel as lambdaLabel } from "../lambda/risk/score.mjs";
import { handler } from "../lambda/risk/index.mjs";
import { computeRiskSeries as appScore, riskLabel as appLabel } from "../../frontend/src/lib/engine/predictor.ts";

const rows = [];
for (let i = 0; i < 40; i++) {
  rows.push({
    date: `2026-10-${String((i % 28) + 1).padStart(2, "0")}`,
    month: i > 20 ? 10 : 9,
    price: 18 - i * 0.35,
    arrivals: 200 + i * 18,
  });
}
const harvestMonths = [10];

function same(a, b, label) {
  const as = JSON.stringify(a);
  const bs = JSON.stringify(b);
  if (as !== bs) {
    console.error(`mismatch: ${label}\n app:    ${as}\n lambda: ${bs}`);
    process.exit(1);
  }
}

const appSeries = appScore(rows, harvestMonths);
const lamSeries = lambdaScore(rows, harvestMonths);
same(appSeries, lamSeries, "series");
same(appLabel(appSeries.at(-1).score), lambdaLabel(lamSeries.at(-1).score), "label");

const res = await handler({
  requestContext: { http: { method: "POST" } },
  body: JSON.stringify({ rows, harvestMonths }),
});
if (res.statusCode !== 200) {
  console.error("handler status", res.statusCode, res.body);
  process.exit(1);
}
const body = JSON.parse(res.body);
const last = appSeries.at(-1);
same(body.score, last.score, "handler score");
same(body.label, appLabel(last.score), "handler label");
same(body.arrivalsSignal, last.arrivalsSignal, "arrivals");
same(body.priceSignal, last.priceSignal, "price");
same(body.seasonSignal, last.seasonSignal, "season");

const health = await handler({ requestContext: { http: { method: "GET" } } });
if (health.statusCode !== 200) {
  console.error("health failed");
  process.exit(1);
}

const bad = await handler({
  requestContext: { http: { method: "POST" } },
  body: "{",
});
if (bad.statusCode !== 400) {
  console.error("expected 400 for bad json");
  process.exit(1);
}

console.log(`parity ok, score ${body.score} ${body.label}`);
