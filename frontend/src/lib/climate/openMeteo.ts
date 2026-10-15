// Fourth risk signal: a rain or heat anomaly for the district, from Open-Meteo.
// Heavy rain and heat waves force early or distress harvests, which feed a glut.
//
// recent window = last 14 days observed + next 7 days forecast (forecast API, past_days)
// baseline      = the same 21 calendar days in each of the previous 10 years (archive API)
// rainSignal    = clamp((recentRain / baselineRain - 1) / 2 * 100)   3x normal rain = 100
// heatSignal    = clamp(tmaxAnomalyC / 4 * 100)                      +4 C above normal = 100
// climate       = max(rainSignal, heatSignal)

export type ClimateSignal = {
  ok: true;
  lat: number;
  lng: number;
  window: { start: string; end: string };
  recentRainMm: number;
  baselineRainMm: number;
  rainRatio: number;
  recentTmaxC: number;
  baselineTmaxC: number;
  tmaxAnomalyC: number;
  rainSignal: number;
  heatSignal: number;
  signal: number;
  driver: "rain" | "heat" | "none";
  baselineYears: number;
  source: string;
  fetchedAt: string;
} | { ok: false; error: string };

const clamp = (x: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, x));
const r1 = (x: number) => Math.round(x * 10) / 10;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const mean = (xs: number[]) => (xs.length ? sum(xs) / xs.length : 0);

export function climateFromSeries(input: {
  recent: { precip: (number | null)[]; tmax: (number | null)[] };
  baseline: { precipTotals: number[]; tmaxMeans: number[] };
}) {
  const precip = input.recent.precip.map((x) => x ?? 0);
  const tmax = input.recent.tmax.filter((x): x is number => typeof x === "number");
  const recentRain = sum(precip);
  const baseRain = mean(input.baseline.precipTotals);
  const recentT = mean(tmax);
  const baseT = mean(input.baseline.tmaxMeans);
  const ratio = baseRain > 0 ? recentRain / baseRain : recentRain > 0 ? 3 : 1;
  const rainSignal = clamp(((ratio - 1) / 2) * 100);
  const anomaly = recentT - baseT;
  const heatSignal = clamp((anomaly / 4) * 100);
  const signal = Math.max(rainSignal, heatSignal);
  const driver: "rain" | "heat" | "none" = signal <= 0 ? "none" : rainSignal >= heatSignal ? "rain" : "heat";
  return {
    recentRainMm: r1(recentRain),
    baselineRainMm: r1(baseRain),
    rainRatio: Math.round(ratio * 100) / 100,
    recentTmaxC: r1(recentT),
    baselineTmaxC: r1(baseT),
    tmaxAnomalyC: r1(anomaly),
    rainSignal: r1(rainSignal),
    heatSignal: r1(heatSignal),
    signal: r1(signal),
    driver,
  };
}

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function fetchClimateSignal(lat: number, lng: number): Promise<ClimateSignal> {
  try {
    const f = new URL("https://api.open-meteo.com/v1/forecast");
    f.searchParams.set("latitude", String(lat));
    f.searchParams.set("longitude", String(lng));
    f.searchParams.set("daily", "precipitation_sum,temperature_2m_max");
    f.searchParams.set("past_days", "14");
    f.searchParams.set("forecast_days", "7");
    f.searchParams.set("timezone", "Asia/Kolkata");
    const fr = await fetch(f, { next: { revalidate: 21600 }, signal: AbortSignal.timeout(8000) });
    if (!fr.ok) throw new Error(`forecast ${fr.status}`);
    const fj = await fr.json();
    const dates: string[] = fj.daily.time;
    const start = dates[0];
    const end = dates[dates.length - 1];

    const thisYear = Number(start.slice(0, 4));
    const years = Array.from({ length: 10 }, (_, i) => thisYear - 10 + i);
    const a = new URL("https://archive-api.open-meteo.com/v1/archive");
    a.searchParams.set("latitude", String(lat));
    a.searchParams.set("longitude", String(lng));
    a.searchParams.set("daily", "precipitation_sum,temperature_2m_max");
    a.searchParams.set("start_date", `${years[0]}-01-01`);
    a.searchParams.set("end_date", `${years[years.length - 1] + 1}-01-31`);
    a.searchParams.set("timezone", "Asia/Kolkata");
    const ar = await fetch(a, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(12000) });
    if (!ar.ok) throw new Error(`archive ${ar.status}`);
    const aj = await ar.json();
    const at: string[] = aj.daily.time;
    const ap: (number | null)[] = aj.daily.precipitation_sum;
    const ax: (number | null)[] = aj.daily.temperature_2m_max;
    const idx = new Map(at.map((d, i) => [d, i]));

    const startD = new Date(start + "T00:00:00Z");
    const len = dates.length;
    const precipTotals: number[] = [];
    const tmaxMeans: number[] = [];
    for (const y of years) {
      const s = new Date(startD);
      s.setUTCFullYear(y);
      const pv: number[] = [];
      const tv: number[] = [];
      for (let k = 0; k < len; k++) {
        const d = new Date(s);
        d.setUTCDate(s.getUTCDate() + k);
        const i = idx.get(ymd(d));
        if (i === undefined) continue;
        if (typeof ap[i] === "number") pv.push(ap[i] as number);
        if (typeof ax[i] === "number") tv.push(ax[i] as number);
      }
      if (pv.length >= len - 2) precipTotals.push(sum(pv));
      if (tv.length >= len - 2) tmaxMeans.push(mean(tv));
    }
    if (precipTotals.length < 5 || tmaxMeans.length < 5) throw new Error("not enough baseline years");

    const res = climateFromSeries({
      recent: { precip: fj.daily.precipitation_sum, tmax: fj.daily.temperature_2m_max },
      baseline: { precipTotals, tmaxMeans },
    });
    return {
      ok: true,
      lat,
      lng,
      window: { start, end },
      ...res,
      baselineYears: precipTotals.length,
      source: "Open-Meteo forecast (past 14 d + next 7 d) vs archive, same window, previous 10 years",
      fetchedAt: new Date().toISOString(),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "fetch failed" };
  }
}

// Blend the deployed Lambda (or in-app) 3 signal score with the climate signal.
// final = 0.85 * base + 0.15 * climate
// base itself is 45/40/15 arrivals/price/season, so effective weights are
// arrivals 38.25, price 34, season 12.75, climate 15.
export const W_CLIMATE = 0.15;
export function blendClimate(baseScore: number, climate: number | null): number {
  if (climate === null || !Number.isFinite(climate)) return baseScore;
  return Math.round(clamp((1 - W_CLIMATE) * baseScore + W_CLIMATE * climate) * 10) / 10;
}
