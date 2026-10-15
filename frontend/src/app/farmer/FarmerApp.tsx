"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AlertCard from "@/components/AlertCard";
import IncomingCall from "@/components/IncomingCall";
import LanguageSwitch from "@/components/LanguageSwitch";
import { onDispatch, readLatestDispatch, respondDispatch, type Dispatch, type PickupFarmer } from "@/lib/dispatch";
import { stopSpeak } from "@/lib/speak";
import { STR, loadLang, saveLang, loadMode, saveMode, type Lang, type Mode } from "@/lib/i18n";
import { type AlertBundle, type FarmerRecord, farmersForCrop, loadRegistry } from "@/lib/engine";

type Phase = "home" | "ringing" | "details" | "accepted" | "declined";

function toContent(d: Dispatch): AlertBundle {
  return {
    cropSlug: d.cropSlug,
    cropNames: d.cropNames,
    unitName: d.unitName,
    offer: d.offer,
    crash: d.crash,
    productName: d.productName ?? "",
    productPrice: d.productPrice ?? 0,
    collectionPoint: d.collectionPoint ?? "",
    unitPhone: d.unitPhone ?? "",
    texts: d.texts,
  };
}

export default function FarmerApp({
  sample,
  incoming,
  auto,
}: {
  sample: AlertBundle;
  incoming: AlertBundle | null;
  auto: boolean;
}) {
  const [lang, setLang] = useState<Lang>("en");
  const [mode, setMode] = useState<Mode>("basic");
  const [phase, setPhase] = useState<Phase>("home");
  const [alert, setAlert] = useState<AlertBundle | null>(null);
  const [dispatchId, setDispatchId] = useState<string | null>(null);
  const [targetedFarmer, setTargetedFarmer] = useState<FarmerRecord | null>(null);

  useEffect(() => {
    setLang(loadLang());
    setMode(loadMode());
  }, []);

  const resolveFarmer = (d: Dispatch) => {
    if (d.targetFarmer) return d.targetFarmer;
    const cropFarmers = farmersForCrop(d.cropSlug);
    return cropFarmers[0] || loadRegistry()[0];
  };

  // ring on: URL handoff (scanned QR), a live dispatch, or a persisted pending one
  useEffect(() => {
    if (incoming && auto) {
      setAlert(incoming);
      const matched = farmersForCrop(incoming.cropSlug)[0] || loadRegistry()[0];
      setTargetedFarmer(matched);
      setPhase("ringing");
      return;
    }
    const latest = readLatestDispatch();
    if (latest && latest.status === "pending") {
      setAlert(toContent(latest));
      setDispatchId(latest.id);
      setTargetedFarmer(resolveFarmer(latest));
      setPhase("ringing");
    }
    return onDispatch((d) => {
      setAlert(toContent(d));
      setDispatchId(d.id);
      setTargetedFarmer(resolveFarmer(d));
      setPhase("ringing");
    });
  }, [incoming, auto]);

  function answer() {
    setPhase("details");
  }

  function respond(status: "accepted" | "declined") {
    stopSpeak();
    if (dispatchId) {
      const pickup: PickupFarmer | undefined =
        status === "accepted"
          ? {
              farmerId: targetedFarmer?.farmerId ?? "KA-KLR-1001",
              name: targetedFarmer?.name ?? "Ramesh Gowda",
              village: targetedFarmer?.village ?? "Vemgal",
              tonnes: targetedFarmer?.plotAcres
                ? Math.round(targetedFarmer.plotAcres * 1.5 * 10) / 10
                : 2.5,
              method: "call",
            }
          : undefined;
      respondDispatch(dispatchId, status, pickup, "call");
    }
    setPhase(status);
  }

  function changeLang(l: Lang) {
    setLang(l);
    saveLang(l);
  }

  function changeMode(m: Mode) {
    setMode(m);
    saveMode(m);
  }

  const t = STR[lang];
  const sc = lang === "hi" ? "deva" : lang === "kn" ? "kn" : "";

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--dash-bg)",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#fff",
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 0 40px rgba(20,35,26,.06)",
        }}
      >
        {/* app top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderBottom: "1px solid var(--dash-line)",
          }}
        >
          <div className="flex items-center gap-2">
            <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
              <rect width="32" height="32" rx="8" fill="var(--brand)" />
              <path
                d="M6 22c4-7 16-7 20 0"
                stroke="#fff"
                strokeWidth="2.3"
                fill="none"
                strokeLinecap="round"
              />
              <rect x="8" y="22" width="2.3" height="4.5" rx="1" fill="#fff" />
              <rect x="21.7" y="22" width="2.3" height="4.5" rx="1" fill="#fff" />
              <circle cx="16" cy="12" r="2.3" fill="var(--turmeric)" />
            </svg>
            <span className={`display ${sc}`} style={{ fontWeight: 700, fontSize: 15 }}>
              {t.saathi}
            </span>
          </div>
          <LanguageSwitch value={lang} onChange={changeLang} />
        </div>

        {/* AgriStack farmer tag when targeted */}
        {targetedFarmer && (
          <div
            style={{
              padding: "6px 16px",
              background: "#f0fdf4",
              borderBottom: "1px solid #bbf7d0",
              fontSize: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 600, color: "var(--brand-deep)" }}>
              🌾 {targetedFarmer.name} · {targetedFarmer.village}
            </span>
            <span className="mono faint" style={{ fontSize: 11 }}>
              {targetedFarmer.farmerId}
            </span>
          </div>
        )}

        {/* interface mode: basic keypad phone (default) vs smartphone app */}
        <div
          style={{
            display: "flex",
            gap: 6,
            padding: "8px 16px",
            borderBottom: "1px solid var(--dash-line)",
            background: "var(--dash-bg)",
          }}
        >
          <ModePill active={mode === "basic"} label={t.modeBasic} onClick={() => changeMode("basic")} sc={sc} />
          <ModePill active={mode === "app"} label={t.modeApp} onClick={() => changeMode("app")} sc={sc} />
        </div>

        {/* screen */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {phase === "home" && (
            <Home
              lang={lang}
              onSample={() => {
                setAlert(sample);
                setDispatchId(null);
                setTargetedFarmer(loadRegistry()[0]);
                setPhase("ringing");
              }}
            />
          )}
          {phase === "ringing" && alert && (
            <IncomingCall
              cropName={alert.cropNames[lang]}
              lang={lang}
              onAnswer={answer}
              onDecline={() => respond("declined")}
            />
          )}
          {phase === "details" && alert && (
            <AlertCard
              a={alert}
              lang={lang}
              status="pending"
              autoPlay
              mode={mode}
              onAccept={() => respond("accepted")}
              onDecline={() => respond("declined")}
            />
          )}
          {phase === "accepted" && alert && <AlertCard a={alert} lang={lang} status="accepted" />}
          {phase === "declined" && alert && <AlertCard a={alert} lang={lang} status="declined" />}
        </div>

        {/* No-tech fallback notice */}
        <div
          style={{
            padding: "10px 14px",
            background: "var(--dash-bg)",
            borderTop: "1px solid var(--dash-line)",
            fontSize: 11.5,
            lineHeight: 1.45,
            textAlign: "center",
            color: "var(--ink-2)",
          }}
          className={sc}
        >
          🏛️ {t.nearestCenterNotice}
        </div>

        {(phase === "accepted" || phase === "declined") && (
          <button className="btn" style={{ margin: 16 }} onClick={() => setPhase("home")}>
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}

function ModePill({
  active,
  label,
  onClick,
  sc,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  sc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={sc}
      style={{
        flex: 1,
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        border: `1px solid ${active ? "var(--brand)" : "var(--border)"}`,
        background: active ? "var(--brand)" : "var(--surface)",
        color: active ? "#fff" : "var(--ink-2)",
      }}
    >
      {label}
    </button>
  );
}

function Home({ lang, onSample }: { lang: Lang; onSample: () => void }) {
  const t = STR[lang];
  const sc = lang === "hi" ? "deva" : lang === "kn" ? "kn" : "";
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 30,
        gap: 6,
      }}
    >
      <div style={{ fontSize: 44 }}>📞</div>
      <div className={`display ${sc}`} style={{ fontSize: 20, fontWeight: 700, marginTop: 8 }}>
        {t.saathi}
      </div>
      <p className={`muted ${sc}`} style={{ fontSize: 14, marginTop: 4 }}>
        {t.waiting}
      </p>
      <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={onSample}>
        Show a sample alert
      </button>
      <div className="flex items-center gap-3" style={{ marginTop: 14, fontSize: 12.5 }}>
        <Link href="/admin" className="link">
          Officer console →
        </Link>
        <span className="faint">·</span>
        <Link href="/field" className="link">
          Field partner →
        </Link>
      </div>
    </div>
  );
}
