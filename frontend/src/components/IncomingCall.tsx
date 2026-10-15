"use client";

import { STR, type Lang } from "@/lib/i18n";

export default function IncomingCall({
  cropName,
  lang,
  onAnswer,
  onDecline,
}: {
  cropName: string;
  lang: Lang;
  onAnswer: () => void;
  onDecline: () => void;
}) {
  const t = STR[lang];
  const sc = lang === "hi" ? "deva" : lang === "kn" ? "kn" : "";
  return (
    <div style={{ height: "100%", background: "linear-gradient(180deg,#0f3d24,#0a2416)", color: "#eafaf0", display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 26px 40px" }}>
      <div style={{ fontSize: 12, letterSpacing: "0.12em", opacity: 0.7 }}>{t.alertTag}</div>

      <div style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 108, height: 108, borderRadius: 999, background: "rgba(255,255,255,.14)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44 }}>
          <span style={{ animation: "ringwiggle 0.9s ease-in-out infinite" }}>📞</span>
        </div>
        <div className={`display ${sc}`} style={{ fontSize: 26, fontWeight: 700, marginTop: 22 }}>{t.saathi}</div>
        <div className={sc} style={{ fontSize: 15, opacity: 0.85, marginTop: 6, textAlign: "center" }}>{t.header(cropName)}</div>
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: 260 }}>
        <CallButton color="#e4483d" glyph="✕" label={t.notNow} onClick={onDecline} />
        <CallButton color="#1fbf5a" glyph="📞" label={t.accept} onClick={onAnswer} pulse />
      </div>
      <style>{`@keyframes ringwiggle{0%,100%{transform:rotate(-12deg)}50%{transform:rotate(12deg)}}@keyframes ringpulse{0%{box-shadow:0 0 0 0 rgba(31,191,90,.5)}70%{box-shadow:0 0 0 16px rgba(31,191,90,0)}100%{box-shadow:0 0 0 0 rgba(31,191,90,0)}}`}</style>
    </div>
  );
}

function CallButton({ color, glyph, label, onClick, pulse }: { color: string; glyph: string; label: string; onClick: () => void; pulse?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <button onClick={onClick} aria-label={label}
        style={{ width: 66, height: 66, borderRadius: 999, background: color, color: "#fff", border: "none", cursor: "pointer", fontSize: 26, display: "flex", alignItems: "center", justifyContent: "center", animation: pulse ? "ringpulse 1.4s infinite" : "none" }}>
        {glyph}
      </button>
      <span style={{ fontSize: 12.5, opacity: 0.9 }}>{label}</span>
    </div>
  );
}
