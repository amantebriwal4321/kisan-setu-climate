// API Gateway HTTP API (payload 2.0) -> crash risk for one crop series.
// Stateless. The Next.js app sends the series. No AWS credentials are required
// inside this function.

import { computeRiskSeries, riskLabel } from "./score.mjs";

const MAX_ROWS = 400;

function json(statusCode, obj) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
    },
    body: JSON.stringify(obj),
  };
}

function num(v) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function handler(event) {
  const method = event?.requestContext?.http?.method || event?.httpMethod || "GET";
  if (method === "GET") {
    return json(200, { ok: true, service: "kisan-setu-risk" });
  }
  if (method !== "POST") {
    return json(405, { error: "use POST" });
  }

  let body = event?.body;
  if (typeof body === "string") {
    if (event.isBase64Encoded) {
      body = Buffer.from(body, "base64").toString("utf8");
    }
    try {
      body = JSON.parse(body);
    } catch {
      return json(400, { error: "invalid json" });
    }
  }
  if (!body || !Array.isArray(body.rows) || body.rows.length === 0) {
    return json(400, { error: "rows required" });
  }
  if (body.rows.length > MAX_ROWS) {
    return json(400, { error: "too many rows" });
  }

  const harvestMonths = Array.isArray(body.harvestMonths)
    ? body.harvestMonths.map((m) => num(m)).filter((m) => m !== null)
    : [];

  const rows = [];
  for (const r of body.rows) {
    const price = num(r?.price);
    const arrivals = num(r?.arrivals);
    const monthFromDate = typeof r?.date === "string" ? num(r.date.slice(5, 7)) : null;
    const month = num(r?.month) ?? monthFromDate;
    if (price === null || arrivals === null || month === null) {
      return json(400, { error: "each row needs price, arrivals, and month or date" });
    }
    rows.push({
      date: typeof r?.date === "string" ? r.date : "",
      month,
      price,
      arrivals,
    });
  }

  const series = computeRiskSeries(rows, harvestMonths);
  const last = series[series.length - 1];
  return json(200, {
    score: last.score,
    label: riskLabel(last.score),
    arrivalsSignal: last.arrivalsSignal,
    priceSignal: last.priceSignal,
    seasonSignal: last.seasonSignal,
    points: series.length,
    source: "lambda",
  });
}
