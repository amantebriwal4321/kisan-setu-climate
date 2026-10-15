"use client";

import { useState, useRef } from "react";
import { parseFarmersCsv } from "@/lib/csv";
import type { FarmerRecord } from "@/data/farmers";

export default function RegistryUpload({
  onLoaded,
}: {
  onLoaded?: (farmers: FarmerRecord[]) => void;
}) {
  const [filename, setFilename] = useState<string>("");
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    setError("");

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const records = parseFarmersCsv(text);
        if (records.length === 0) {
          setError("No valid farmer records found in CSV.");
          return;
        }
        setCount(records.length);
        if (onLoaded) onLoaded(records);
      } catch (err) {
        setError("Failed to parse CSV file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="panel p-4" style={{ borderRadius: 12 }}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <div style={{ fontWeight: 600, fontSize: 13.5 }}>📂 Ingest Custom AgriStack CSV</div>
        <a
          href="/data/farmers.csv"
          download="sample_agristack_seed.csv"
          className="link faint"
          style={{ fontSize: 11.5 }}
        >
          Sample CSV ↗
        </a>
      </div>
      <p className="faint" style={{ fontSize: 12, lineHeight: 1.45, marginBottom: 12 }}>
        Drop or select an export from AgriStack Crop Sown Registry (UFSI format: farmer_id, name, village, phone, crops, plot_acres, fpo).
      </p>

      <div className="flex items-center gap-3">
        <input
          type="file"
          ref={fileRef}
          accept=".csv"
          onChange={handleFile}
          style={{ display: "none" }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="btn"
          style={{ fontSize: 12, padding: "6px 12px" }}
        >
          Select CSV File
        </button>
        {filename && (
          <span className="mono faint" style={{ fontSize: 11.5 }}>
            {filename}
          </span>
        )}
      </div>

      {count !== null && !error && (
        <div className="mt-2" style={{ color: "var(--brand-deep)", fontSize: 12, fontWeight: 600 }}>
          ✓ Ingested {count} verified farmer plots.
        </div>
      )}
      {error && (
        <div className="mt-2" style={{ color: "#b91c1c", fontSize: 12 }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
