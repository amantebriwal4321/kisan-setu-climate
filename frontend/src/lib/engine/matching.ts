// Matching engine (ported from backend/app/matching.py). Connect a surplus crop to the
// nearest processing units by distance + capacity, and compute the rupee/kg impact.

import type { Unit } from "./seed";

const OFFER_BONUS_PER_KG = 5.0;
const MIN_OFFER = 9.0;

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(a)) * 10) / 10;
}

export function offerPrice(crashPrice: number) {
  return Math.round(Math.max(MIN_OFFER, crashPrice + OFFER_BONUS_PER_KG) * 10) / 10;
}

export type Match = {
  unitSlug: string;
  unitName: string;
  kind: string;
  products: string[];
  distanceKm: number;
  allocatedTonnes: number;
  offerPrice: number;
  rupeesSaved: number;
  lat: number;
  lng: number;
};

export type MatchTotals = {
  surplusTonnes: number;
  tonnesMatched: number;
  tonnesUnmatched: number;
  kgRescued: number;
  rupeesSaved: number;
  unitsEngaged: number;
  offerPrice: number;
  crashPrice: number;
};

export function match(
  cropSlug: string,
  cropLat: number,
  cropLng: number,
  surplusTonnes: number,
  crashPrice: number,
  units: Unit[],
  maxKm = 80
): { matches: Match[]; totals: MatchTotals } {
  const offer = offerPrice(crashPrice);

  const candidates = units
    .filter((u) => (u.crops || []).includes(cropSlug))
    .map((u) => ({ dist: haversineKm(cropLat, cropLng, u.lat, u.lng), u }))
    .filter((c) => c.dist <= maxKm)
    .sort((a, b) => a.dist - b.dist);

  const matches: Match[] = [];
  let remaining = surplusTonnes;
  for (const { dist, u } of candidates) {
    if (remaining <= 0) break;
    const take = Math.min(u.weeklyCapacity, remaining);
    if (take <= 0) continue;
    remaining -= take;
    const kg = take * 1000;
    matches.push({
      unitSlug: u.slug,
      unitName: u.name,
      kind: u.kind,
      products: u.products || [],
      distanceKm: dist,
      allocatedTonnes: Math.round(take * 10) / 10,
      offerPrice: offer,
      rupeesSaved: Math.round((offer - crashPrice) * kg),
      lat: u.lat,
      lng: u.lng,
    });
  }

  const matchedTonnes = surplusTonnes - Math.max(0, remaining);
  const totals: MatchTotals = {
    surplusTonnes: Math.round(surplusTonnes * 10) / 10,
    tonnesMatched: Math.round(matchedTonnes * 10) / 10,
    tonnesUnmatched: Math.round(Math.max(0, remaining) * 10) / 10,
    kgRescued: Math.round(matchedTonnes * 1000),
    rupeesSaved: matches.reduce((a, m) => a + m.rupeesSaved, 0),
    unitsEngaged: matches.length,
    offerPrice: offer,
    crashPrice,
  };
  return { matches, totals };
}
