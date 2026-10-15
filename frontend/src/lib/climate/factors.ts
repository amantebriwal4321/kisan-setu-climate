// Emission factors used for "CO2e avoided". Every number here is copied from a
// published source, listed next to it. Nothing is tuned.
//
// What the number means: the cradle-to-retail greenhouse gas footprint of the food
// that stays in use instead of being dumped. That is the same accounting FAO uses
// for the footprint of food wastage. It is an estimate, not a measured reduction.

export type FactorSet = "crop" | "conservative" | "fao";

export const SOURCES = {
  poore: {
    short: "Poore and Nemecek (2018), Science 360(6392):987-992, via Our World in Data",
    url: "https://ourworldindata.org/grapher/ghg-per-kg-poore",
    note: "Global mean kg CO2e per kg of product, farm to retail, 2010 reference year.",
  },
  fao: {
    short: "FAO (2013), Food Wastage Footprint: Impacts on Natural Resources, Summary Report",
    url: "https://www.fao.org/4/i3347e/i3347e.pdf",
    note: "3.3 Gt CO2e (excluding land use change) for 1.3 Gt of edible food wasted, about 2.54 kg CO2e per kg.",
  },
  unep: {
    short: "UNEP (2024), Food Waste Index Report 2024",
    url: "https://www.unep.org/resources/publication/food-waste-index-report-2024",
    note: "Food loss and waste generate an estimated 8 to 10 percent of global greenhouse gas emissions.",
  },
  openMeteo: {
    short: "Open-Meteo forecast and historical weather APIs (ERA5 based archive)",
    url: "https://open-meteo.com/",
    note: "Free, no key. Daily precipitation and max temperature for the district centre.",
  },
} as const;

// Poore and Nemecek (2018) global means, kg CO2e per kg product (OWID table).
// Beans and green chilli have no own row, so they use "Other Vegetables".
export const CROP_FACTORS: Record<string, { ef: number; row: string }> = {
  tomato: { ef: 2.09, row: "Tomatoes" },
  onion: { ef: 0.5, row: "Onions & Leeks" },
  potato: { ef: 0.46, row: "Potatoes" },
  beans: { ef: 0.53, row: "Other Vegetables" },
  chilli: { ef: 0.53, row: "Other Vegetables" },
};

// The tomato mean includes heated greenhouse production in colder countries.
// Kolar tomatoes are open field, so the conservative set uses "Other Vegetables"
// (0.53) for every crop. This is a lower bound style choice, stated as such.
export const CONSERVATIVE_EF = 0.53;

// FAO 2013: 3.3 Gt CO2e / 1.3 Gt edible food wasted.
export const FAO_AVG_EF = Math.round((3.3 / 1.3) * 100) / 100; // 2.54

export function factorFor(crop: string, set: FactorSet = "crop"): { ef: number; label: string; source: string; url: string } {
  if (set === "fao") return { ef: FAO_AVG_EF, label: "FAO food wastage average", source: SOURCES.fao.short, url: SOURCES.fao.url };
  if (set === "conservative") return { ef: CONSERVATIVE_EF, label: "Conservative, Other Vegetables row", source: SOURCES.poore.short, url: SOURCES.poore.url };
  const f = CROP_FACTORS[crop] ?? { ef: CONSERVATIVE_EF, row: "Other Vegetables" };
  return { ef: f.ef, label: `Crop factor, ${f.row} row`, source: SOURCES.poore.short, url: SOURCES.poore.url };
}

export function co2eKg(tonnes: number, ef: number): number {
  return Math.round(tonnes * 1000 * ef);
}
