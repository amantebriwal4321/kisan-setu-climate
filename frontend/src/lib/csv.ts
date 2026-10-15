// Dependency-free CSV parse & serialize for the AgriStack farmer registry.
// Keeps Kisan Setu lightweight, offline-ready, and able to ingest custom CSVs on the fly.

import type { FarmerRecord } from "../data/farmers";

export function serializeFarmersCsv(farmers: FarmerRecord[]): string {
  const header = "farmer_id,name,village,phone,crops,plot_acres,fpo";
  const rows = farmers.map((f) =>
    [
      f.farmerId,
      `"${f.name.replace(/"/g, '""')}"`,
      `"${f.village.replace(/"/g, '""')}"`,
      f.phone,
      `"${f.crops.join(" ")}"`,
      f.plotAcres,
      `"${(f.fpo || "").replace(/"/g, '""')}"`,
    ].join(",")
  );
  return [header, ...rows].join("\n");
}

export function parseFarmersCsv(csvText: string): FarmerRecord[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // simple CSV parser handling quoted strings
  const parseLine = (line: string): string[] => {
    const fields: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === "," && !inQuotes) {
        fields.push(cur.trim());
        cur = "";
      } else {
        cur += c;
      }
    }
    fields.push(cur.trim());
    return fields;
  };

  const records: FarmerRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseLine(line);
    if (cols.length < 5) continue;
    const [farmerId, name, village, phone, cropsStr, acresStr, fpo] = cols;
    records.push({
      farmerId: farmerId || `KA-KLR-${String(1000 + i).padStart(4, "0")}`,
      name: name || "Unknown Farmer",
      village: village || "Kolar",
      phone: phone || "9800000000",
      crops: cropsStr ? cropsStr.split(/\s+/).filter(Boolean) : ["tomato"],
      plotAcres: parseFloat(acresStr) || 1.0,
      fpo: fpo || "",
    });
  }
  return records;
}
