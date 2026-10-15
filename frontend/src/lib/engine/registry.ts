// Crop-specific farmer targeting, computed from the farmer registry (the AgriStack
// Farmer + Crop Sown Registry stand-in). Pure and deterministic — safe on server or
// client. This is what makes a tomato crash reach ONLY tomato farmers.

import { FARMERS, FIELD_PARTNERS, VILLAGE_PARTNERS, type FarmerRecord, type FieldPartner, type PartnerRole } from "../../data/farmers";

export type { FarmerRecord, FieldPartner, PartnerRole } from "../../data/farmers";
export { FIELD_PARTNERS, VILLAGE_PARTNERS } from "../../data/farmers";

export function loadRegistry(): FarmerRecord[] {
  return FARMERS;
}

// Farmers who sowed this crop this season. Optionally scoped to one field partner
// (by role) — i.e. the villages that partner covers.
export function farmersForCrop(
  slug: string,
  opts?: { role?: PartnerRole; partnerName?: string }
): FarmerRecord[] {
  let rows = FARMERS.filter((f) => f.crops.includes(slug));
  if (opts?.role && opts.partnerName) {
    rows = rows.filter((f) => VILLAGE_PARTNERS[f.village]?.[opts.role!] === opts.partnerName);
  }
  return rows;
}

export type AlertTargets = {
  count: number;
  farmers: FarmerRecord[];
  byVillage: { village: string; count: number }[];
};

// The real numbers behind "N tomato farmers alerted", grouped by village.
export function alertTargets(slug: string): AlertTargets {
  const farmers = farmersForCrop(slug);
  const counts = new Map<string, number>();
  for (const f of farmers) counts.set(f.village, (counts.get(f.village) ?? 0) + 1);
  const byVillage = [...counts.entries()]
    .map(([village, count]) => ({ village, count }))
    .sort((a, b) => b.count - a.count);
  return { count: farmers.length, farmers, byVillage };
}

export function partnersByRole(role: PartnerRole): FieldPartner[] {
  return FIELD_PARTNERS.filter((p) => p.role === role);
}

// The partner responsible for a village in a given role (for labelling a farmer row).
export function partnerFor(village: string, role: PartnerRole): string {
  return VILLAGE_PARTNERS[village]?.[role] ?? "";
}

export const ROLE_LABELS: Record<PartnerRole, string> = {
  krishi_sakhi: "Krishi Sakhi",
  vle: "CSC VLE",
  fpo: "FPO coordinator",
};
