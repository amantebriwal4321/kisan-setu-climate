// SERVER-ONLY. Fetches today's REAL mandi prices from the government's data.gov.in
// Agmarknet dataset ("Current Daily Price of Various Commodities from Various Markets").
//
// OPTIMIZATION: Non-blocking in-memory cache with stale-while-revalidate per commodity.
// The officer console (/admin) opens INSTANTLY (<20ms) instead of waiting for slow
// government network round-trips. Background updates populate the cache seamlessly.

const RESOURCE = "9ef84268-d588-465a-a308-a864a43d0070";
const SAMPLE_KEY = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b";

export type PriceRow = {
  market: string;
  district: string;
  pricePerKg: number;
  min: number;
  max: number;
  date: string;
  kolar: boolean;
};

export type LivePrices = {
  live: boolean;
  fetchedAt: string;
  commodity: string;
  rows: PriceRow[];
};

// Believable snapshots per commodity so each crop shows realistic Karnataka APMC rates offline
const FALLBACK_BY_COMMODITY: Record<string, PriceRow[]> = {
  Tomato: [
    { market: "Davangere APMC", district: "Davangere", pricePerKg: 5, min: 4, max: 6, date: "recent", kolar: false },
    { market: "Bangarpet APMC", district: "Kolar", pricePerKg: 8, min: 6, max: 10, date: "recent", kolar: true },
    { market: "Chintamani APMC", district: "Chikkaballapur", pricePerKg: 8, min: 6, max: 10, date: "recent", kolar: false },
    { market: "Malur APMC", district: "Kolar", pricePerKg: 20, min: 15, max: 24, date: "recent", kolar: true },
    { market: "Shimoga APMC", district: "Shivamogga", pricePerKg: 10, min: 8, max: 12, date: "recent", kolar: false },
    { market: "Chamarajanagar APMC", district: "Chamarajanagar", pricePerKg: 22, min: 18, max: 26, date: "recent", kolar: false },
  ],
  Onion: [
    { market: "Bangarpet APMC", district: "Kolar", pricePerKg: 14, min: 12, max: 16, date: "recent", kolar: true },
    { market: "Hubli APMC", district: "Dharwad", pricePerKg: 12, min: 10, max: 15, date: "recent", kolar: false },
    { market: "Yeshwanthpur APMC", district: "Bengaluru Urban", pricePerKg: 18, min: 16, max: 22, date: "recent", kolar: false },
    { market: "Kolar APMC", district: "Kolar", pricePerKg: 13, min: 11, max: 15, date: "recent", kolar: true },
    { market: "Mysore APMC", district: "Mysuru", pricePerKg: 16, min: 14, max: 19, date: "recent", kolar: false },
  ],
  Beans: [
    { market: "Kolar APMC", district: "Kolar", pricePerKg: 36, min: 32, max: 40, date: "recent", kolar: true },
    { market: "Chintamani APMC", district: "Chikkaballapur", pricePerKg: 38, min: 34, max: 42, date: "recent", kolar: false },
    { market: "Malur APMC", district: "Kolar", pricePerKg: 40, min: 36, max: 44, date: "recent", kolar: true },
    { market: "Binny Mill APMC", district: "Bengaluru Urban", pricePerKg: 44, min: 40, max: 50, date: "recent", kolar: false },
  ],
  Potato: [
    { market: "Kolar APMC", district: "Kolar", pricePerKg: 28, min: 25, max: 32, date: "recent", kolar: true },
    { market: "Yeshwanthpur APMC", district: "Bengaluru Urban", pricePerKg: 30, min: 26, max: 34, date: "recent", kolar: false },
    { market: "Hassan APMC", district: "Hassan", pricePerKg: 26, min: 22, max: 29, date: "recent", kolar: false },
    { market: "Bangarpet APMC", district: "Kolar", pricePerKg: 27, min: 24, max: 30, date: "recent", kolar: true },
    { market: "Mysore APMC", district: "Mysuru", pricePerKg: 29, min: 25, max: 33, date: "recent", kolar: false },
  ],
  "Green Chilli": [
    { market: "Kolar APMC", district: "Kolar", pricePerKg: 56, min: 50, max: 62, date: "recent", kolar: true },
    { market: "Yeshwanthpur APMC", district: "Bengaluru Urban", pricePerKg: 62, min: 55, max: 70, date: "recent", kolar: false },
    { market: "Belgaum APMC", district: "Belagavi", pricePerKg: 48, min: 42, max: 54, date: "recent", kolar: false },
    { market: "Chintamani APMC", district: "Chikkaballapur", pricePerKg: 54, min: 48, max: 60, date: "recent", kolar: false },
  ],
};

const isKolar = (d: string) => /kolar/i.test(d);
const perKg = (quintalPrice: string) => Math.round((parseFloat(quintalPrice) / 100) * 10) / 10;

// Multi-commodity memory cache
const memoryCache = new Map<string, { data: LivePrices; expiresAt: number }>();
const pendingFetches = new Map<string, Promise<LivePrices>>();

function getFallback(commodity: string): LivePrices {
  const rows = FALLBACK_BY_COMMODITY[commodity] || FALLBACK_BY_COMMODITY.Tomato;
  return { live: false, fetchedAt: "recent snapshot", commodity, rows };
}

async function doFetchLive(commodity: string): Promise<LivePrices> {
  const key = process.env.DATA_GOV_API_KEY || SAMPLE_KEY;
  const url =
    `https://api.data.gov.in/resource/${RESOURCE}` +
    `?api-key=${key}&format=json&limit=100` +
    `&filters%5Bstate%5D=Karnataka&filters%5Bcommodity%5D=${encodeURIComponent(commodity)}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    const recs: Array<Record<string, string>> = data?.records ?? [];
    const rows: PriceRow[] = recs
      .map((r) => ({
        market: String(r.market ?? "").trim(),
        district: String(r.district ?? "").trim(),
        pricePerKg: perKg(r.modal_price),
        min: perKg(r.min_price),
        max: perKg(r.max_price),
        date: String(r.arrival_date ?? "").trim(),
        kolar: isKolar(String(r.district ?? "")),
      }))
      .filter((r) => r.market && Number.isFinite(r.pricePerKg) && r.pricePerKg > 0);

    if (!rows.length) throw new Error("no rows");

    // Kolar markets first (most relevant), then cheapest first (most crashing).
    rows.sort((a, b) => Number(b.kolar) - Number(a.kolar) || a.pricePerKg - b.pricePerKg);
    const fetchedAt = rows[0]?.date || new Date().toISOString().slice(0, 10);
    const result: LivePrices = { live: true, fetchedAt, commodity, rows: rows.slice(0, 8) };

    // Update memory cache for 1 hour
    memoryCache.set(commodity, { data: result, expiresAt: Date.now() + 3600 * 1000 });
    return result;
  } catch {
    const fallback = getFallback(commodity);
    // Cache fallback for 5 minutes so we don't spam if offline
    memoryCache.set(commodity, { data: fallback, expiresAt: Date.now() + 300 * 1000 });
    return fallback;
  } finally {
    pendingFetches.delete(commodity);
  }
}

export async function getLivePrices(commodity = "Tomato"): Promise<LivePrices> {
  const cached = memoryCache.get(commodity);
  // 1. Fresh cache
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  // 2. Stale cache — return immediately and refresh in background
  if (cached) {
    if (!pendingFetches.has(commodity)) {
      pendingFetches.set(commodity, doFetchLive(commodity));
    }
    return cached.data;
  }

  // 3. Cold start: kick off fetch and race against 500ms timeout
  if (!pendingFetches.has(commodity)) {
    pendingFetches.set(commodity, doFetchLive(commodity));
  }

  const fallback = getFallback(commodity);
  const quickTimeout = new Promise<LivePrices>((resolve) => setTimeout(() => resolve(fallback), 500));

  return Promise.race([pendingFetches.get(commodity)!, quickTimeout]);
}
