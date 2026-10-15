"use client";

import { useState } from "react";
import type { RiskLabel } from "@/lib/engine";

type Source = "bedrock" | "template";

export default function ExplainRisk({
  name,
  score,
  label,
  surplusTonnes,
  signals,
}: {
  name: string;
  score: number;
  label: RiskLabel;
  surplusTonnes: number;
  signals: { arrivals: number; price: number; season: number };
}) {
  const [text, setText] = useState("");
  const [source, setSource] = useState<Source | null>(null);
  const [busy, setBusy] = useState(false);

  async function explain() {
    setBusy(true);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, score, label, surplusTonnes, signals }),
      });
      const data = (await res.json()) as { text?: string; source?: Source };
      setText(data.text || "");
      setSource(data.source === "bedrock" ? "bedrock" : "template");
    } catch {
      setText("");
      setSource("template");
    } finally {
      setBusy(false);
    }
  }

  const sourceLabel = source === "bedrock"
    ? "Amazon Bedrock"
    : "Local Hindi template (Bedrock not configured, or the call failed)";

  return (
    <div className="panel p-3 mt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="eyebrow">Why this score, in Hindi</div>
        <button className="btn" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => void explain()} disabled={busy}>
          {busy ? "Writing…" : "Explain"}
        </button>
      </div>
      {text && (
        <>
          <p className="deva" style={{ fontSize: 14.5, lineHeight: 1.55, marginTop: 8 }}>{text}</p>
          <p className="faint" style={{ fontSize: 11, marginTop: 6 }}>{sourceLabel}</p>
        </>
      )}
    </div>
  );
}
