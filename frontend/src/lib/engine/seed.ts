// Deterministic seed data (ported from backend/app/seed.py). A real-shaped Kolar tomato
// crash: arrivals climb through the harvest peak while price collapses ~₹18 → ₹4/kg.
// Everything is computed at module load so the demo is identical every run, fully offline.

export type District = { slug: string; name: string; state: string; lat: number; lng: number };
export type SeriesRow = { date: string; month: number; price: number; arrivals: number };
export type Crop = {
  slug: string;
  name: string;
  nameHi: string;
  nameKn: string;
  unit: string;
  harvestMonths: number[];
  series: SeriesRow[];
};
export type Unit = {
  slug: string;
  name: string;
  kind: "SHG" | "FPO";
  lat: number;
  lng: number;
  crops: string[];
  weeklyCapacity: number;
  products: string[];
  contact: string;
  collectionPoint: string; // the local FPO/SHG drop-off point a farmer already knows
  phone: string;           // helpline the farmer can call to confirm
};
export type Buyer = { name: string; city: string; wants: string[]; pricePerKg: number };
export type DemoFarmer = { name: string; village: string; tonnes: number };

const DAYS = 60;
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;

function isoDaysAgo(daysAgo: number): { date: string; month: number } {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  const date = d.toISOString().slice(0, 10);
  return { date, month: d.getMonth() + 1 };
}

type SeriesParams = {
  pStart: number; pEnd: number; pSlideStart: number; pSlideLen: number;
  aBase: number; aPeakExtra: number; aRampStart: number; aRampLen: number;
};

function genSeries(p: SeriesParams): SeriesRow[] {
  const rows: SeriesRow[] = [];
  const minTarget = Math.min(p.pStart, p.pEnd);
  for (let i = 0; i < DAYS; i++) {
    const slide = clamp((i - p.pSlideStart) / p.pSlideLen, 0, 1);
    let price = p.pStart - slide * (p.pStart - p.pEnd) + 0.4 * Math.sin(i * 0.7);
    price = Math.max(price, minTarget - 0.5);
    const ramp = clamp((i - p.aRampStart) / p.aRampLen, 0, 1);
    let arrivals = p.aBase + ramp * p.aPeakExtra + 0.05 * p.aBase * Math.sin(i * 0.9);
    arrivals = Math.max(arrivals, 10);
    const { date, month } = isoDaysAgo(DAYS - 1 - i);
    rows.push({ date, month, price: r2(price), arrivals: r1(arrivals) });
  }
  return rows;
}

const CROP_DEFS: { slug: string; name: string; nameHi: string; nameKn: string; params: SeriesParams }[] = [
  { slug: "tomato", name: "Tomato", nameHi: "टमाटर", nameKn: "ಟೊಮೇಟೊ", params: { pStart: 18, pEnd: 4, pSlideStart: 30, pSlideLen: 28, aBase: 200, aPeakExtra: 720, aRampStart: 28, aRampLen: 24 } },
  { slug: "onion", name: "Onion", nameHi: "प्याज़", nameKn: "ಈರುಳ್ಳಿ", params: { pStart: 22, pEnd: 13, pSlideStart: 30, pSlideLen: 24, aBase: 150, aPeakExtra: 240, aRampStart: 32, aRampLen: 20 } },
  { slug: "beans", name: "Beans", nameHi: "बीन्स", nameKn: "ಬೀನ್ಸ್", params: { pStart: 40, pEnd: 36, pSlideStart: 35, pSlideLen: 20, aBase: 60, aPeakExtra: 45, aRampStart: 40, aRampLen: 18 } },
  { slug: "potato", name: "Potato", nameHi: "आलू", nameKn: "ಆಲೂಗಡ್ಡೆ", params: { pStart: 16, pEnd: 28, pSlideStart: 28, pSlideLen: 26, aBase: 110, aPeakExtra: 10, aRampStart: 35, aRampLen: 15 } },
  { slug: "chilli", name: "Green Chilli", nameHi: "हरी मिर्च", nameKn: "ಹಸಿರು ಮೆಣಸಿನಕಾಯಿ", params: { pStart: 32, pEnd: 56, pSlideStart: 25, pSlideLen: 25, aBase: 45, aPeakExtra: 8, aRampStart: 30, aRampLen: 15 } },
];

export const DISTRICT: District = {
  slug: "kolar", name: "Kolar", state: "Karnataka", lat: 13.1367, lng: 78.1292,
};

export const CROPS: Crop[] = CROP_DEFS.map((d) => {
  const series = genSeries(d.params);
  const harvestMonths = Array.from(new Set(series.slice(-20).map((r) => r.month))).sort((a, b) => a - b);
  return { slug: d.slug, name: d.name, nameHi: d.nameHi, nameKn: d.nameKn, unit: "kg", harvestMonths, series };
});

export const UNITS: Unit[] = [
  { slug: "kolar-mahila-foods", name: "Kolar Mahila SHG Foods", kind: "SHG", lat: 13.1367, lng: 78.1292, crops: ["tomato", "potato"], weeklyCapacity: 30, products: ["paste", "puree", "chips"], contact: "Kolar town", collectionPoint: "Kolar APMC yard, near the bus stand", phone: "94480 21730" },
  { slug: "srinivaspura-fpo", name: "Srinivaspura Farmer Producer Co.", kind: "FPO", lat: 13.341, lng: 78.214, crops: ["tomato", "onion", "potato"], weeklyCapacity: 55, products: ["paste", "flakes", "chips"], contact: "Srinivaspura", collectionPoint: "Srinivaspura FPO centre, near the taluk office", phone: "94491 55820" },
  { slug: "malur-womens-unit", name: "Malur Women's Agro Unit", kind: "SHG", lat: 13.004, lng: 77.937, crops: ["tomato", "beans", "potato"], weeklyCapacity: 25, products: ["puree", "dried", "chips"], contact: "Malur", collectionPoint: "Malur SHG centre, near the railway station", phone: "97311 40265" },
  { slug: "chintamani-fpo", name: "Chintamani Farmer Producer Co.", kind: "FPO", lat: 13.402, lng: 78.053, crops: ["tomato", "onion", "chilli"], weeklyCapacity: 60, products: ["paste", "ketchup", "pickle"], contact: "Chintamani", collectionPoint: "Chintamani FPO yard, near the market", phone: "90080 63417" },
  { slug: "bangarpet-shg", name: "Bangarpet SHG Kitchen", kind: "SHG", lat: 12.991, lng: 78.178, crops: ["tomato", "potato"], weeklyCapacity: 20, products: ["paste", "chips"], contact: "Bangarpet", collectionPoint: "Bangarpet SHG kitchen, near the bus stand", phone: "96329 71104" },
  { slug: "mulbagal-cluster", name: "Mulbagal Food Cluster", kind: "FPO", lat: 13.165, lng: 78.393, crops: ["tomato", "onion", "chilli"], weeklyCapacity: 40, products: ["flakes", "powder", "pickle"], contact: "Mulbagal", collectionPoint: "Mulbagal food cluster, near the highway junction", phone: "88617 22093" },
];

// Believable farmers for the officer's "who's coming" pickup list (demo has no farmer login).
export const DEMO_FARMERS: DemoFarmer[] = [
  { name: "Ramesh", village: "Vemgal", tonnes: 1.8 },
  { name: "Lakshmi", village: "Sugatur", tonnes: 2.1 },
  { name: "Manjunath", village: "Narasapura", tonnes: 1.2 },
  { name: "Anitha", village: "Holur", tonnes: 1.6 },
  { name: "Venkatesh", village: "Tekal", tonnes: 2.3 },
  { name: "Shivamma", village: "Masti", tonnes: 1.4 },
  { name: "Nagaraj", village: "Huttur", tonnes: 1.9 },
  { name: "Bhagya", village: "Arabikothanur", tonnes: 1.1 },
  { name: "Krishnappa", village: "Vokkaleri", tonnes: 2.0 },
  { name: "Gowramma", village: "Dodda Ullarthi", tonnes: 1.5 },
];

export const BUYERS: Buyer[] = [
  { name: "Bangalore Fresh Foods", city: "Bengaluru", wants: ["paste", "puree", "chips"], pricePerKg: 54 },
  { name: "Chennai Retail Chain", city: "Chennai", wants: ["paste", "ketchup", "pickle"], pricePerKg: 48 },
  { name: "South Foods Processors", city: "Hosur", wants: ["flakes", "powder", "chips"], pricePerKg: 58 },
];
