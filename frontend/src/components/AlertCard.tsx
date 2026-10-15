"use client";

import { stopSpeak } from "@/lib/speak";
import SpeakButton from "@/components/SpeakButton";
import ValueChain from "@/components/ValueChain";
import Keypad from "@/components/Keypad";
import { STR, voiceCode, type Lang, type Mode } from "@/lib/i18n";
import type { AlertBundle } from "@/lib/engine";

function scriptClass(lang: Lang) {
  return lang === "hi" ? "deva" : lang === "kn" ? "kn" : "";
}

export default function AlertCard({
  a,
  lang,
  status,
  autoPlay = false,
  mode = "app",
  onAccept,
  onDecline,
}: {
  a: AlertBundle;
  lang: Lang;
  status: "pending" | "accepted" | "declined";
  autoPlay?: boolean;
  mode?: Mode;
  onAccept?: () => void;
  onDecline?: () => void;
}) {
  const t = STR[lang];
  const sc = scriptClass(lang);
  const crop = a.cropNames[lang];
  const basic = mode === "basic";

  if (status === "accepted") {
    return (
      <Screen tone="ok">
        <div style={{ fontSize: 40 }}>✓</div>
        <div className={`display ${sc}`} style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>{t.booked}</div>
        <p className={sc} style={{ fontSize: 13.5, marginTop: 10, opacity: 0.9, lineHeight: 1.55 }}>
          {a.collectionPoint ? t.pickup(crop, a.collectionPoint, a.unitPhone, a.unitName) : t.bring(crop, a.unitName, a.offer)}
        </p>
        <p className={`faint ${sc}`} style={{ fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>{t.bookedNote}</p>
      </Screen>
    );
  }
  if (status === "declined") {
    return (
      <Screen tone="muted">
        <div style={{ fontSize: 34 }}>—</div>
        <div className={`display ${sc}`} style={{ fontSize: 18, fontWeight: 700, marginTop: 6 }}>{t.okNotNow}</div>
      </Screen>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ background: "#0f3d24", color: "#eafaf0", padding: "22px 16px 14px" }}>
        <div className={sc} style={{ fontSize: 11, letterSpacing: "0.08em", opacity: 0.7 }}>{t.saathi} · {t.alertTag}</div>
        <div className={`display ${sc}`} style={{ fontSize: 21, fontWeight: 700, marginTop: 8, lineHeight: 1.2 }}>
          {t.header(crop)}
        </div>
        <div className={sc} style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>{t.mandi(a.crash)}</div>
      </div>

      <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
        {basic && (
          <div className={sc} style={{ background: "#eef7f0", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 11px", fontSize: 11.5, fontWeight: 600, color: "var(--brand-deep)", lineHeight: 1.35 }}>
            {t.callBanner}
          </div>
        )}
        <div className="panel" style={{ padding: 12 }}>
          <div className={`faint ${sc}`} style={{ fontSize: 11 }}>{t.sellHere}</div>
          <div style={{ fontWeight: 600, marginTop: 3 }}>{a.unitName}</div>
          <div className="kpi-num" style={{ fontSize: 26, color: "var(--brand-deep)", marginTop: 2 }}>₹{a.offer}/kg</div>
        </div>

        {/* Why buy from the farmer at ₹9 when the mandi is ₹3? */}
        <ValueChain crash={a.crash} offer={a.offer} productName={a.productName} productPrice={a.productPrice} cropSlug={a.cropSlug} lang={lang} />

        <SpeakButton
          text={a.texts[lang]}
          voice={voiceCode[lang]}
          autoPlay={autoPlay}
          labels={{ play: t.play, pause: t.pause, resume: t.resume, noVoice: t.noVoice }}
          className="btn btn-ghost"
          style={{ alignSelf: "flex-start", padding: "8px 14px", fontSize: 13 }}
        />

        <div style={{ flex: 1 }} />

        {basic ? (
          <div>
            <div className={`faint ${sc}`} style={{ fontSize: 11.5, textAlign: "center", marginBottom: 8 }}>{t.pressKeys}</div>
            <Keypad
              acceptLabel={t.accept}
              declineLabel={t.notNow}
              scriptClass={sc}
              onAccept={() => { stopSpeak(); onAccept?.(); }}
              onDecline={() => { stopSpeak(); onDecline?.(); }}
            />
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button className={`btn ${sc}`} style={{ flex: 1 }} onClick={() => { stopSpeak(); onDecline?.(); }}>
              {t.notNow}
            </button>
            <button className={`btn btn-primary ${sc}`} style={{ flex: 1.4 }} onClick={() => { stopSpeak(); onAccept?.(); }}>
              {t.accept}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Screen({ children, tone }: { children: React.ReactNode; tone: "ok" | "muted" }) {
  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      textAlign: "center", padding: "28px 22px",
      background: tone === "ok" ? "linear-gradient(180deg,#eafaf0,#ffffff)" : "#fff",
      color: tone === "ok" ? "var(--brand-deep)" : "var(--ink-2)",
    }}>
      {children}
    </div>
  );
}
