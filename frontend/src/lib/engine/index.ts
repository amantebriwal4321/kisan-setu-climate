// Public engine surface. Pure, synchronous, deterministic — safe to call from server or
// client components. Replaces the Python API for the deployed single-app build.
// createEngine() is the same logic over whatever crop and unit lists you pass
// (static seed, or a DynamoDB catalog loaded on the server).

import { CROPS, UNITS, BUYERS, DISTRICT, type Crop, type Unit } from "./seed";
import { computeRiskSeries, riskLabel, type RiskLabel, type RiskPoint } from "./predictor";
import { match, type Match, type MatchTotals } from "./matching";
import { loadRegistry, alertTargets } from "./registry";
import type { Lang } from "../i18n";

const SEASON_BASELINE_DAYS = 14;
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const r1 = (x: number) => Math.round(x * 10) / 10;

function surplusTonnes(c: Crop): number {
  const arr = c.series.map((s) => s.arrivals);
  const base = mean(arr.slice(0, SEASON_BASELINE_DAYS));
  const latest = arr[arr.length - 1];
  return r1(Math.max(0, latest - base));
}

export type CropSummary = {
  slug: string;
  name: string;
  district: string;
  state: string;
  unit: string;
  latestPrice: number;
  latestArrivals: number;
  risk: number;
  label: RiskLabel;
  surplusTonnes: number;
};

export type SeriesPoint = { date: string; price: number; arrivals: number; risk: number };

export type CropDetail = CropSummary & {
  series: SeriesPoint[];
  signals: { arrivals: number; price: number; season: number };
  harvestMonths: number[];
  districtLat: number;
  districtLng: number;
};

export type Overview = {
  district: string;
  cropsTracked: number;
  cropsAtRisk: number;
  kgAtRisk: number;
  routableKg: number;
  wasteReductionPct: number;
  potentialRupeesSaved: number;
  unitsAvailable: number;
  buyers: number;
  farmersReached: number;
};

export function createEngine(crops: Crop[], units: Unit[]) {
  const RISK: Record<string, RiskPoint[]> = {};
  for (const c of crops) {
    RISK[c.slug] = computeRiskSeries(
      c.series.map((s) => ({ date: s.date, month: s.month, price: s.price, arrivals: s.arrivals })),
      c.harvestMonths
    );
  }

  function summary(c: Crop): CropSummary {
    const last = c.series[c.series.length - 1];
    const risk = RISK[c.slug][RISK[c.slug].length - 1].score;
    return {
      slug: c.slug,
      name: c.name,
      district: DISTRICT.name,
      state: DISTRICT.state,
      unit: c.unit,
      latestPrice: last.price,
      latestArrivals: last.arrivals,
      risk,
      label: riskLabel(risk),
      surplusTonnes: surplusTonnes(c),
    };
  }

  function getCrops(): CropSummary[] {
    return crops.map(summary).sort((a, b) => b.risk - a.risk);
  }

  function getCrop(slug: string): CropDetail | null {
    const c = crops.find((x) => x.slug === slug);
    if (!c) return null;
    const risks = RISK[c.slug];
    const series: SeriesPoint[] = c.series.map((s, i) => ({
      date: s.date,
      price: s.price,
      arrivals: s.arrivals,
      risk: risks[i].score,
    }));
    const lastRisk = risks[risks.length - 1];
    return {
      ...summary(c),
      series,
      signals: { arrivals: lastRisk.arrivalsSignal, price: lastRisk.priceSignal, season: lastRisk.seasonSignal },
      harvestMonths: c.harvestMonths,
      districtLat: DISTRICT.lat,
      districtLng: DISTRICT.lng,
    };
  }

  function getMatches(slug: string): { matches: Match[]; totals: MatchTotals } | null {
    const c = crops.find((x) => x.slug === slug);
    if (!c) return null;
    const s = summary(c);
    return match(c.slug, DISTRICT.lat, DISTRICT.lng, s.surplusTonnes, s.latestPrice, units);
  }

  function getOverview(): Overview {
    const sums = getCrops();
    const atRisk = sums.filter((s) => s.risk >= 40);
    let kgAtRisk = 0;
    let rupeesSaved = 0;
    let routableKg = 0;
    for (const s of atRisk) {
      const m = getMatches(s.slug);
      kgAtRisk += Math.round(s.surplusTonnes * 1000);
      rupeesSaved += m?.totals.rupeesSaved ?? 0;
      routableKg += m?.totals.kgRescued ?? 0;
    }
    const registry = loadRegistry();
    const wasteReductionPct = kgAtRisk > 0 ? Math.round((routableKg / kgAtRisk) * 100) : 0;
    return {
      district: `${DISTRICT.name}, ${DISTRICT.state}`,
      cropsTracked: sums.length,
      cropsAtRisk: atRisk.length,
      kgAtRisk,
      routableKg,
      wasteReductionPct,
      potentialRupeesSaved: rupeesSaved,
      unitsAvailable: units.length,
      buyers: BUYERS.length,
      farmersReached: registry.length,
    };
  }

  function productValue(products: string[]): { name: string; price: number } {
    const buyer = BUYERS
      .filter((b) => b.wants.some((w) => products.includes(w)))
      .sort((a, b) => b.pricePerKg - a.pricePerKg)[0];
    return { name: products[0] ?? "paste", price: buyer?.pricePerKg ?? 0 };
  }

  function alertText(slug: string): AlertBundle | null {
    const c = crops.find((x) => x.slug === slug);
    if (!c) return null;
    const res = getMatches(slug)!;
    const best = res.matches[0];
    const offer = res.totals.offerPrice;
    const crash = res.totals.crashPrice;
    const cropNames: Record<Lang, string> = { en: c.name, hi: c.nameHi, kn: c.nameKn };

    if (!best) {
      return {
        cropSlug: c.slug, cropNames, unitName: "", offer, crash, productName: "", productPrice: 0,
        collectionPoint: "", unitPhone: "",
        texts: {
          en: `${c.name} prices are crashing. No processing unit is free nearby yet.`,
          hi: `${c.nameHi} के दाम गिर रहे हैं। अभी पास में कोई यूनिट खाली नहीं है।`,
          kn: `${c.nameKn} ಬೆಲೆ ಕುಸಿಯುತ್ತಿದೆ. ಸಮೀಪದಲ್ಲಿ ಯಾವ ಘಟಕವೂ ಖಾಲಿ ಇಲ್ಲ.`,
        },
      };
    }

    const km = Math.round(best.distanceKm);
    const nearEn = best.distanceKm < 1 ? "in your area" : `${km} km away`;
    const nearHi = best.distanceKm < 1 ? "आपके पास" : `${km} किमी दूर`;
    const nearKn = best.distanceKm < 1 ? "ನಿಮ್ಮ ಹತ್ತಿರ" : `${km} ಕಿಮೀ ದೂರ`;
    const prod = productValue(best.products || []);
    const unit = units.find((u) => u.slug === best.unitSlug);

    const isRising = c.series[c.series.length - 1].price >= c.series[0].price;
    if (isRising) {
      return {
        cropSlug: c.slug, cropNames, unitName: best.unitName, offer, crash, productName: prod.name, productPrice: prod.price,
        collectionPoint: unit?.collectionPoint ?? "", unitPhone: unit?.phone ?? "",
        texts: {
          en: `Good news! ${c.name} prices are rising (now ₹${crash}/kg). Demand is strong. ${best.unitName}, ${nearEn}, offers ₹${offer}/kg for premium stock.`,
          hi: `अच्छी खबर! ${c.nameHi} के दाम बढ़ रहे हैं (अभी ₹${crash}/किलो)। मांग मजबूत है। ${best.unitName}, ${nearHi}, ₹${offer}/किलो का भाव दे रहा है।`,
          kn: `ಶುಭ ಸುದ್ದಿ! ${c.nameKn} ಬೆಲೆ ಹೆಚ್ಚುತ್ತಿದೆ (ಈಗ ₹${crash}/ಕೆಜಿ). ಬೇಡಿಕೆ ಚೆನ್ನಾಗಿದೆ. ${best.unitName}, ${nearKn}, ₹${offer}/ಕೆಜಿ ನೀಡುತ್ತಿದೆ.`,
        },
      };
    }

    return {
      cropSlug: c.slug, cropNames, unitName: best.unitName, offer, crash, productName: prod.name, productPrice: prod.price,
      collectionPoint: unit?.collectionPoint ?? "", unitPhone: unit?.phone ?? "",
      texts: {
        en: `${c.name} prices are crashing (now ₹${crash}/kg). Do not dump your crop. ${best.unitName}, ${nearEn}, will buy it at ₹${offer}/kg.`,
        hi: `${c.nameHi} के दाम गिर रहे हैं (अभी ₹${crash}/किलो)। फसल मत फेंकिए। ${best.unitName}, ${nearHi}, ₹${offer}/किलो में खरीदेगा।`,
        kn: `${c.nameKn} ಬೆಲೆ ಕುಸಿಯುತ್ತಿದೆ (ಈಗ ₹${crash}/ಕೆಜಿ). ಬೆಳೆ ಎಸೆಯಬೇಡಿ. ${best.unitName}, ${nearKn}, ₹${offer}/ಕೆಜಿಗೆ ಖರೀದಿಸುತ್ತದೆ.`,
      },
    };
  }

  return { getCrops, getCrop, getMatches, getOverview, alertText, units, crops };
}

export type Engine = ReturnType<typeof createEngine>;

export type PackedDetails = Record<string, {
  detail: CropDetail;
  matches: Match[];
  totals: MatchTotals;
  alert: AlertBundle;
}>;

export function packAll(engine: Engine) {
  const crops = engine.getCrops();
  const details: PackedDetails = Object.fromEntries(
    crops.map((c) => {
      const m = engine.getMatches(c.slug)!;
      return [c.slug, { detail: engine.getCrop(c.slug)!, matches: m.matches, totals: m.totals, alert: engine.alertText(c.slug)! }];
    })
  );
  return { crops, details, overview: engine.getOverview(), units: engine.units };
}

const staticEngine = createEngine(CROPS, UNITS);

export function getCrops() {
  return staticEngine.getCrops();
}
export function getCrop(slug: string) {
  return staticEngine.getCrop(slug);
}
export function getMatches(slug: string) {
  return staticEngine.getMatches(slug);
}
export function getOverview() {
  return staticEngine.getOverview();
}
export function alertText(slug: string) {
  return staticEngine.alertText(slug);
}

export type AlertBundle = {
  cropSlug: string;
  cropNames: Record<Lang, string>;
  unitName: string;
  offer: number;
  crash: number;
  productName: string;
  productPrice: number;
  collectionPoint: string;
  unitPhone: string;
  texts: Record<Lang, string>;
};

export const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
export const num = (n: number) => Math.round(n).toLocaleString("en-IN");

export type { Match, MatchTotals } from "./matching";
export type { RiskLabel } from "./predictor";
export type { Unit, District, Buyer, DemoFarmer } from "./seed";
export { DISTRICT, UNITS, BUYERS, DEMO_FARMERS } from "./seed";
export { loadRegistry, alertTargets, farmersForCrop, partnersByRole, partnerFor, ROLE_LABELS, FIELD_PARTNERS, VILLAGE_PARTNERS } from "./registry";
export type { FarmerRecord, FieldPartner, PartnerRole, AlertTargets } from "./registry";
