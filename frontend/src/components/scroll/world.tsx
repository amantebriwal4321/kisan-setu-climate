"use client";

import type { CSSProperties, ReactNode } from "react";

// ---- Stage: a sticky 100vh frame that pins while its section scrolls ----
export function Stage({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}

// ---- Sky: a full-bleed warm gradient ----
export function Sky({ stops }: { stops: string }) {
  return <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${stops})` }} />;
}

// ---- Grain: tactile film texture over the art, under the text ----
const GRAIN =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.5'/></svg>`
  );
export function Grain({ opacity = 0.06 }: { opacity?: number }) {
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: `url("${GRAIN}")`, opacity, mixBlendMode: "overlay", pointerEvents: "none" }} />
  );
}

// ---- Sun: a glowing disc ----
export function Sun({ x, y, r = 150, disc = 54, color = "#ffd766", glow = "#f6c453" }: { x: number | string; y: number | string; r?: number; disc?: number; color?: string; glow?: string }) {
  return (
    <div style={{ position: "absolute", left: x, top: y, width: r * 2, height: r * 2, transform: "translate(-50%,-50%)", pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `radial-gradient(circle, ${glow} 0%, ${glow}00 62%)` }} />
      <div style={{ position: "absolute", left: "50%", top: "50%", width: disc, height: disc, transform: "translate(-50%,-50%)", borderRadius: "50%", background: color, boxShadow: `0 0 60px ${glow}` }} />
    </div>
  );
}

// ---- Hills: layered rolling ground, golden-hour greens ----
export function Hills({ tone = "warm" }: { tone?: "warm" | "dusk" }) {
  const c = tone === "dusk"
    ? ["#6f7f52", "#4a5f38", "#2c3d22"]
    : ["#a9c877", "#7aa64f", "#4f7a34"];
  return (
    <svg viewBox="0 0 1440 420" preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: "58%", display: "block" }}>
      <path d="M0 250 C 300 200, 620 236, 900 214 C 1160 194, 1300 240, 1440 218 L1440 420 L0 420 Z" fill={c[0]} />
      <path d="M0 310 C 360 262, 720 300, 1080 284 C 1260 276, 1360 306, 1440 292 L1440 420 L0 420 Z" fill={c[1]} />
      <path d="M0 360 C 420 330, 960 362, 1440 350 L1440 420 L0 420 Z" fill={c[2]} />
    </svg>
  );
}

// ---- Silhouettes ----
export function Tree({ x, y, s = 1, dark = "#2c3d22" }: { x: number; y: number; s?: number; dark?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-3" y="-26" width="6" height="30" rx="2" fill={dark} />
      <circle cx="0" cy="-34" r="16" fill={dark} />
      <circle cx="-12" cy="-26" r="11" fill={dark} />
      <circle cx="12" cy="-26" r="11" fill={dark} />
    </g>
  );
}

export function Wheat({ x, y, s = 1, delay = 0, dark = "#2c3d22", tip = "#f6c453" }: { x: number; y: number; s?: number; delay?: number; dark?: string; tip?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} style={{ transformOrigin: "bottom", animation: `swayW 4.2s ease-in-out ${delay}s infinite` }}>
      <path d="M0 0 L0 -40" stroke={dark} strokeWidth="2.4" strokeLinecap="round" />
      {[0, 1, 2].map((k) => (
        <g key={k} transform={`translate(0 ${-16 - k * 8})`}>
          <path d="M0 0 q8 -4 11 -12" stroke={dark} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M0 0 q-8 -4 -11 -12" stroke={dark} strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      ))}
      <circle cx="0" cy="-42" r="2.6" fill={tip} />
      <style>{`@keyframes swayW{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}`}</style>
    </g>
  );
}

// ---- Persistent thin ribbon shown across scenes so intent never disappears ----
export function Ribbon() {
  return (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 30, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div style={{ margin: 12, padding: "6px 14px", borderRadius: 999, background: "rgba(20,20,15,.55)", color: "#fff", fontSize: 12, fontWeight: 600, backdropFilter: "blur(6px)" }}>
        Kisan Setu · turning a crashing crop into a fair price
      </div>
    </div>
  );
}
