"use client";

import { useEffect, useRef, useState } from "react";
import PhoneFrame from "@/components/PhoneFrame";
import AlertCard from "@/components/AlertCard";
import PriceDrop from "@/components/PriceDrop";
import SvgMap from "@/components/SvgMap";
import ImpactMeter from "@/components/ImpactMeter";
import RiskBadge from "@/components/RiskBadge";
import LanguageSwitch from "@/components/LanguageSwitch";
import { stopSpeak } from "@/lib/speak";
import { STR, loadLang, saveLang, type Lang } from "@/lib/i18n";
import { num, alertTargets, UNITS, type CropDetail, type Match, type MatchTotals, type AlertBundle, type Unit } from "@/lib/engine";

const STEP_MS = 4200;

const STEPS = [
  { t: "Detect", c: "Kolar’s tomato price is collapsing — arrivals flooded the mandi and the price fell from ₹18 to ₹4/kg. The crash-risk score hits 100." },
  { t: "Route", c: "Kisan Setu instantly matches the surplus to the nearest processing units. Crop that would be dumped can now be saved instead." },
  { t: "Field Bridge", c: "AgriStack isolates the exact tomato plots. Krishi Sakhis, CSC VLEs, and FPOs receive village rosters to reach non-smartphone farmers." },
  { t: "Listen & Visit", c: "An automated voice call speaks the offer aloud in Kannada, Hindi, or English — with an in-person walk-in option at the village center." },
  { t: "Confirmed", c: "The farmer presses 1 (or is booked at the center). The deal is locked, the unit is notified, and the FPO collection van routes pickup." },
];

export default function FlowClient({
  detail, matches, totals, alert, units = UNITS,
}: {
  detail: CropDetail; matches: Match[]; totals: MatchTotals; alert: AlertBundle; units?: Unit[];
}) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [lang, setLang] = useState<Lang>("en");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setLang(loadLang()), []);

  useEffect(() => {
    if (!playing) return;
    if (step >= STEPS.length - 1) { setPlaying(false); return; }
    // hold on the Listen step so the spoken message can finish and be replayed
    // in each language — don't auto-advance past it.
    if (step === 3) { setPlaying(false); return; }
    timer.current = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [playing, step]);

  const routed = step >= 1;
  const targets = alertTargets(detail.slug);

  function go(n: number) { setPlaying(false); stopSpeak(); setStep(Math.max(0, Math.min(STEPS.length - 1, n))); }
  function restart() { stopSpeak(); setStep(0); setPlaying(true); }
  function changeLang(l: Lang) { setLang(l); saveLang(l); }

  return (
    <main className="mx-auto max-w-6xl w-full px-5 py-8 flex flex-col gap-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="eyebrow">The full flow</span>
            <span className="faint" style={{ fontSize: 11 }}>· step {step + 1} of {STEPS.length}</span>
          </div>
          <h1 className="display" style={{ fontSize: "clamp(22px,3.2vw,30px)", fontWeight: 700 }}>{step + 1}. {STEPS[step].t}</h1>
          <p className="muted" style={{ fontSize: 16, marginTop: 8, maxWidth: 720, lineHeight: 1.55, minHeight: 52 }}>{STEPS[step].c}</p>
        </div>
        <div className="mt-1"><LanguageSwitch value={lang} onChange={changeLang} /></div>
      </section>

      {/* the whole deal in one line — who does what */}
      <section className="card p-3" style={{ overflowX: "auto" }}>
        <div className="flex items-center gap-2" style={{ minWidth: "max-content" }}>
          <span className="eyebrow" style={{ whiteSpace: "nowrap", marginRight: 4 }}>How the deal works</span>
          {["Detect crash", "Route surplus", "Krishi Sakhi receives roster", "Voice call / Center visit", "Farmer locks price", "Booked · FPO van pickup"].map((s, i) => (
            <span key={i} className="flex items-center gap-2" style={{ whiteSpace: "nowrap" }}>
              <span className="pill" style={{ fontSize: 12 }}>{s}</span>
              {i < 5 && <span style={{ color: "var(--ink-3)" }}>→</span>}
            </span>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
        {/* officer */}
        <div className="card p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <div className="eyebrow">Officer console</div>
            <div className="flex items-center gap-2">
              <span style={{ fontWeight: 600, fontSize: 14 }}>{detail.name}</span>
              <RiskBadge label={detail.label} />
            </div>
          </div>
          <PriceDrop were={detail.series[0].price} now={detail.latestPrice} risk={detail.risk} />
          <div className="mt-4" style={{ opacity: routed ? 1 : 0.35, transition: "opacity .5s" }}>
            <ImpactMeter active={routed} rupees={totals.rupeesSaved} kg={totals.kgRescued} units={totals.unitsEngaged} />
            <p className="faint" style={{ fontSize: 11.5, marginTop: 8, lineHeight: 1.4 }}>
              Kg kept out of waste is the share of this crop&apos;s surplus the units can take this week, from the demo series.
            </p>
          </div>
          <div className="mt-4">
            <SvgMap district={{ lat: detail.districtLat, lng: detail.districtLng, name: detail.district }} units={units} matched={matches} routed={routed} />
          </div>
          {step >= 4 && (
            <div className="panel p-3 mt-4" style={{ borderColor: "var(--brand)", color: "var(--brand-deep)", fontSize: 13, fontWeight: 600 }}>
              ✓ Confirmed — {num(targets.count)} {detail.name.toLowerCase()} farmers targeted via AgriStack across {targets.byVillage.length} villages, 1 accepted live
            </div>
          )}
        </div>

        {/* travel + phone */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center gap-4">
          {step === 2 && (
            <div className="pill" style={{ fontSize: 13, animation: "pulse 1s ease-in-out infinite" }}>👩‍🌾 Krishi Sakhi receives tomato grower roster…</div>
          )}
          <PhoneFrame height={460}>
            {step < 2 && <Waiting lang={lang} />}
            {step === 2 && <Ringing crop={alert.cropNames[lang]} lang={lang} />}
            {step === 3 && <AlertCard a={alert} lang={lang} status="pending" autoPlay mode="basic" />}
            {step >= 4 && <AlertCard a={alert} lang={lang} status="accepted" />}
          </PhoneFrame>
        </div>
      </section>

      <section className="card p-4 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <button className="btn" onClick={() => go(step - 1)} disabled={step === 0}>‹ Prev</button>
          <button className="btn btn-primary" onClick={() => (step >= STEPS.length - 1 ? restart() : setPlaying((p) => !p))}>
            {step >= STEPS.length - 1 ? "↻ Replay" : playing ? "❚❚ Pause" : "▶ Play"}
          </button>
          <button className="btn" onClick={() => go(step + 1)} disabled={step >= STEPS.length - 1}>Next ›</button>
        </div>
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <button key={s.t} onClick={() => go(i)} aria-label={s.t} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <span style={{ display: "block", width: i === step ? 22 : 8, height: 8, borderRadius: 999, background: i <= step ? "var(--brand)" : "var(--border)", transition: "all .3s" }} />
            </button>
          ))}
        </div>
      </section>

      <style>{`@keyframes pulse{0%,100%{opacity:.55}50%{opacity:1}}`}</style>
    </main>
  );
}

function Waiting({ lang }: { lang: Lang }) {
  const t = STR[lang];
  const sc = lang === "hi" ? "deva" : lang === "kn" ? "kn" : "";
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 26, color: "var(--ink-2)" }}>
      <div style={{ fontSize: 34 }}>📞</div>
      <div className={`display ${sc}`} style={{ fontSize: 18, fontWeight: 600, marginTop: 10, color: "var(--ink)" }}>{t.saathi}</div>
      <p className={sc} style={{ fontSize: 13, marginTop: 6 }}>{t.waiting}</p>
    </div>
  );
}

function Ringing({ crop, lang }: { crop: string; lang: Lang }) {
  const t = STR[lang];
  const sc = lang === "hi" ? "deva" : lang === "kn" ? "kn" : "";
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 26, background: "linear-gradient(180deg,#0f3d24,#0a2416)", color: "#eafaf0" }}>
      <div style={{ fontSize: 12, opacity: 0.7, letterSpacing: "0.1em" }}>{t.alertTag}</div>
      <div style={{ width: 72, height: 72, borderRadius: 999, background: "rgba(255,255,255,.14)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, marginTop: 16, animation: "pulse 1s ease-in-out infinite" }}>📞</div>
      <div className={`display ${sc}`} style={{ fontSize: 20, fontWeight: 700, marginTop: 14 }}>{t.saathi}</div>
      <div className={sc} style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>{t.header(crop)}</div>
    </div>
  );
}
