"use client";

import Link from "next/link";
import { useScrollProgress, lerp, range } from "@/lib/useScrollProgress";
import { Stage, Sky, Sun, Hills, Grain, Tree, Wheat } from "./world";

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

// ---------------------------------------------------------------- Hero
export function HeroScene() {
  const [ref, p] = useScrollProgress<HTMLElement>();
  const sunY = lerp(66, 42, range(p, 0, 0.5));
  const fade = 1 - range(p, 0.72, 1);
  return (
    <section ref={ref} style={{ height: "200vh", position: "relative" }}>
      <Stage>
        <Sky stops="#ffe9b0 0%, #f7c95f 42%, #f2a25c 100%" />
        <Sun x="74%" y={`${sunY}%`} r={190} />
        <svg viewBox="0 0 1440 420" preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: "58%", transform: `translateY(${p * 40}px)` }}>
          <path d="M0 250 C 300 200, 620 236, 900 214 C 1160 194, 1300 240, 1440 218 L1440 420 L0 420 Z" fill="#a9c877" />
          <path d="M0 310 C 360 262, 720 300, 1080 284 C 1260 276, 1360 306, 1440 292 L1440 420 L0 420 Z" fill="#7aa64f" />
          <path d="M0 360 C 420 330, 960 362, 1440 350 L1440 420 L0 420 Z" fill="#4f7a34" />
          <Tree x={210} y={300} s={1.1} /><Tree x={1180} y={296} s={1.3} /><Tree x={760} y={310} s={0.9} />
        </svg>
        <svg viewBox="0 0 1440 160" preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: "22%", transform: `translateY(${p * 80}px)` }}>
          {[120, 300, 520, 760, 980, 1200, 1360].map((x, i) => <Wheat key={i} x={x} y={150} s={1.5} delay={i * 0.3} />)}
        </svg>
        <Grain />
        <div style={{ position: "absolute", left: "7%", top: "22%", maxWidth: 720, opacity: fade, transform: `translateY(${-p * 30}px)` }}>
          <div className="eyebrow" style={{ color: "#7a4a1e" }}>Waste and energy · keep the harvest edible</div>
          <h1 className="display" style={{ fontSize: "clamp(44px,8vw,92px)", lineHeight: 0.98, marginTop: 14, color: "#241a10", textShadow: "0 1px 20px rgba(255,240,200,.5)" }}>
            Glut to <span className="mark">Value</span>.
          </h1>
          <p style={{ fontSize: "clamp(15px,1.9vw,21px)", color: "#3a2a18", marginTop: 18, maxWidth: 600, lineHeight: 1.5, fontWeight: 500 }}>
            Surplus that nobody routes becomes food waste.
            Kisan Setu scores the crash, sends the crop to a nearby processing unit, and calls the farmer
            in their own language before it is dumped.
          </p>
        </div>
      </Stage>
    </section>
  );
}

// ---------------------------------------------------------------- Glut
export function GlutScene({ surplusTonnes = 0 }: { surplusTonnes?: number }) {
  const [ref, p] = useScrollProgress<HTMLElement>();
  const grow = range(p, 0.1, 0.85);
  const value = Math.round(lerp(0, surplusTonnes, grow));
  const pile = Array.from({ length: 22 });
  return (
    <section ref={ref} style={{ height: "220vh", position: "relative" }}>
      <Stage>
        <Sky stops="#fff0cf 0%, #f6cf74 55%, #eaa85c 100%" />
        <Hills />
        <svg viewBox="0 0 600 300" preserveAspectRatio="xMidYMax meet" style={{ position: "absolute", left: "50%", bottom: "16%", width: "min(560px,80vw)", transform: "translateX(-50%)" }}>
          <ellipse cx="300" cy="272" rx="180" ry="24" fill="#00000015" />
          {pile.map((_, i) => {
            const col = i % 7, row = Math.floor(i / 7);
            const x = 190 + col * 32 + (row % 2) * 16;
            const y = 260 - row * 26;
            const shown = grow > i / pile.length;
            return <circle key={i} cx={x} cy={y} r="16" fill="#e4483d" opacity={shown ? 0.9 : 0} style={{ transition: "opacity .2s" }} />;
          })}
        </svg>
        <Grain />
        <div style={{ position: "absolute", left: 0, right: 0, top: "16%", textAlign: "center", padding: "0 24px" }}>
          <h2 className="display" style={{ fontSize: "clamp(26px,4.6vw,46px)", color: "#3a2610" }}>Left unsold, this surplus is waste</h2>
          <div className="kpi-num" style={{ fontSize: "clamp(44px,9vw,104px)", color: "#b4291c", lineHeight: 1 }}>{value.toLocaleString("en-IN")} t</div>
          <p style={{ fontSize: 17, color: "#5a4326", marginTop: 8, maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}>
            Computed from this demo&apos;s Kolar arrivals, above a normal early-season week. Not a national estimate.
          </p>
        </div>
      </Stage>
    </section>
  );
}

// ---------------------------------------------------------------- Crash
export function CrashScene() {
  const [ref, p] = useScrollProgress<HTMLElement>();
  const d = range(p, 0.15, 0.85);
  const price = lerp(18, 3.82, d).toFixed(2);
  return (
    <section ref={ref} style={{ height: "220vh", position: "relative" }}>
      <Stage>
        <Sky stops="#f4c07a 0%, #e78a63 52%, #b25b74 100%" />
        <Sun x="24%" y="30%" r={150} color="#ffcaa0" glow="#f0a06a" />
        <Hills tone="dusk" />
        <svg viewBox="0 0 520 260" style={{ position: "absolute", right: "9%", top: "26%", width: "min(460px,74vw)" }}>
          <polyline points="20,40 120,58 210,96 320,168 500,214" fill="none" stroke="#7a1d1d" strokeWidth="4" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - d} />
          <circle cx={lerp(20, 500, d)} cy={lerp(40, 214, d)} r="7" fill="#b4291c" />
        </svg>
        <Grain />
        <div style={{ position: "absolute", left: "8%", top: "22%", maxWidth: 640 }}>
          <h2 className="display" style={{ fontSize: "clamp(26px,4.6vw,46px)", color: "#3a1b1b" }}>When the harvest floods the market,<br />the price crashes.</h2>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 18 }}>
            <span className="kpi-num" style={{ fontSize: 26, color: "#7a5a4a", textDecoration: "line-through" }}>₹18</span>
            <span className="kpi-num" style={{ fontSize: "clamp(40px,8vw,80px)", color: "#7a1d1d" }}>₹{price}<span style={{ fontSize: 20 }}>/kg</span></span>
          </div>
          <p style={{ fontSize: 16, color: "#4d2a2a", marginTop: 6 }}>The farmer can’t even cover his cost — so he dumps it.</p>
        </div>
      </Stage>
    </section>
  );
}

// ---------------------------------------------------------------- Reroute (PEAK + signature)
export function RerouteScene({
  rupees = 0,
  kg = 0,
  unitCount = 0,
}: {
  rupees?: number;
  kg?: number;
  unitCount?: number;
}) {
  const [ref, p] = useScrollProgress<HTMLElement>();
  const go = range(p, 0.15, 0.85);
  const dots = [[150, 90], [470, 110], [120, 250], [500, 240], [310, 60], [320, 320]];
  return (
    <section ref={ref} style={{ height: "300vh", position: "relative" }}>
      <Stage>
        <Sky stops="#e88a63 0%, #a95f6e 55%, #5a3a52 100%" />
        <Grain opacity={0.08} />
        <div style={{ position: "absolute", left: 0, right: 0, top: "9%", textAlign: "center", padding: "0 24px" }}>
          <div className="eyebrow" style={{ color: "#ffd9a8" }}>The rescue. Scroll to route it.</div>
          <h2 className="display" style={{ fontSize: "clamp(26px,4.6vw,48px)", color: "#fff", marginTop: 6 }}>We reroute the surplus to nearby units, before it rots.</h2>
        </div>
        <svg viewBox="0 0 620 380" style={{ position: "absolute", left: "50%", top: "40%", width: "min(560px,86vw)", transform: "translate(-50%,-40%)" }}>
          {dots.map(([x, y], i) => {
            const f = range(p, 0.15 + i * 0.05, 0.55 + i * 0.05);
            return <line key={"l" + i} x1={310} y1={190} x2={x} y2={y} stroke="#8ed46a" strokeWidth="3" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - f} markerEnd="url(#ar)" />;
          })}
          <defs><marker id="ar" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#8ed46a" /></marker></defs>
          {dots.map(([x, y], i) => {
            const f = range(p, 0.15 + i * 0.05, 0.55 + i * 0.05);
            return <circle key={"u" + i} cx={x} cy={y} r={9} fill="#8ed46a" opacity={0.35 + f * 0.65} />;
          })}
          <circle cx={310} cy={190} r={15} fill="#e4483d" stroke="#fff" strokeWidth="3" />
        </svg>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: "12%", display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap", padding: "0 20px" }}>
          {[["Rupees if sold, not dumped", inr(rupees * go)], ["Kg kept out of waste", Math.round(kg * go).toLocaleString("en-IN")], ["Units that can take it", String(Math.round(unitCount * go))]].map(([l, v]) => (
            <div key={l} style={{ background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 14, padding: "12px 20px", textAlign: "center", minWidth: 150 }}>
              <div className="kpi-num" style={{ fontSize: 26, color: "#eafaf0" }}>{v}</div>
              <div style={{ fontSize: 12, color: "#ffe9c8", marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: "6%", textAlign: "center", fontSize: 12, color: "#ffe9c8", padding: "0 20px" }}>
          Computed from this demo&apos;s Kolar series and unit capacities. The scroll only moves the numbers.
        </div>
      </Stage>
    </section>
  );
}

// ---------------------------------------------------------------- Call
export function CallScene() {
  const [ref, p] = useScrollProgress<HTMLElement>();
  const phase = p < 0.36 ? "ring" : p < 0.68 ? "offer" : "booked";
  return (
    <section ref={ref} style={{ height: "240vh", position: "relative" }}>
      <Stage>
        <Sky stops="#f3a76a 0%, #b06a6e 60%, #6a4160 100%" />
        <Grain opacity={0.07} />
        <div style={{ position: "absolute", left: 0, right: 0, top: "12%", textAlign: "center", padding: "0 24px" }}>
          <h2 className="display" style={{ fontSize: "clamp(26px,4.6vw,46px)", color: "#fff" }}>And the farmer gets a call,<br />in their own language.</h2>
        </div>
        <div style={{ position: "absolute", left: "50%", top: "56%", transform: "translate(-50%,-50%)" }}>
          <div style={{ width: 232, height: 452, background: "#0b0f0c", borderRadius: 34, padding: 9, boxShadow: "0 24px 60px rgba(0,0,0,.4)" }}>
            <div style={{ width: "100%", height: "100%", borderRadius: 26, overflow: "hidden", background: "#fff", display: "flex", flexDirection: "column" }}>
              {phase === "ring" && (
                <div style={{ height: "100%", background: "linear-gradient(180deg,#0f3d24,#0a2416)", color: "#eafaf0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                  <div style={{ fontSize: 44 }}>📞</div>
                  <div className="display" style={{ fontSize: 20, fontWeight: 700 }}>Krishi Saathi</div>
                  <div style={{ fontSize: 13, opacity: .8 }}>Tomato price alert</div>
                </div>
              )}
              {phase === "offer" && (
                <div style={{ height: "100%", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="display" style={{ fontSize: 18, fontWeight: 700 }}>Tomato crashing</div>
                  <div className="panel" style={{ padding: 12 }}>
                    <div className="faint" style={{ fontSize: 11 }}>Sell here instead</div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>Kolar Mahila Foods</div>
                    <div className="kpi-num" style={{ fontSize: 26, color: "var(--brand-deep)" }}>₹9/kg</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span className="pill" style={{ fontSize: 11 }}>🔊 English</span>
                    <span className="pill deva" style={{ fontSize: 11 }}>हिंदी</span>
                    <span className="pill kn" style={{ fontSize: 11 }}>ಕನ್ನಡ</span>
                  </div>
                  <div style={{ flex: 1 }} />
                  <div className="btn btn-primary" style={{ pointerEvents: "none" }}>Accept · हाँ</div>
                </div>
              )}
              {phase === "booked" && (
                <div style={{ height: "100%", background: "linear-gradient(180deg,#eafaf0,#fff)", color: "var(--brand-deep)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 22 }}>
                  <div style={{ fontSize: 42 }}>✓</div>
                  <div className="display" style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>Booked</div>
                  <p style={{ fontSize: 13, marginTop: 8, opacity: .9 }}>Bring your tomato to Kolar Mahila Foods. You’ll get ₹9/kg.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Stage>
    </section>
  );
}

// ---------------------------------------------------------------- Sunrise (resolve + CTAs)
export function SunriseScene() {
  const [ref, p] = useScrollProgress<HTMLElement>();
  const sunY = lerp(78, 40, range(p, 0, 0.6));
  return (
    <section ref={ref} style={{ height: "180vh", position: "relative" }}>
      <Stage>
        <Sky stops="#ffe9b0 0%, #f7c95f 46%, #bfe08a 100%" />
        <Sun x="50%" y={`${sunY}%`} r={230} />
        <Hills />
        <svg viewBox="0 0 1440 160" preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: "20%" }}>
          {[160, 380, 620, 860, 1080, 1300].map((x, i) => <Wheat key={i} x={x} y={150} s={1.5} delay={i * 0.3} />)}
        </svg>
        <Grain />
        <div style={{ position: "absolute", left: 0, right: 0, top: "20%", textAlign: "center", padding: "0 22px" }}>
          <h2 className="display" style={{ fontSize: "clamp(28px,5vw,54px)", color: "#241a10", lineHeight: 1.06 }}>
            Kisan Setu — saving the harvest,<br />and the farmer’s <span className="mark">price</span>.
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3" style={{ marginTop: 26 }}>
            <Link href="/flow" className="btn btn-primary btn-lg">▶ Watch the 60-second flow</Link>
            <Link href="/admin" className="btn btn-lg">Officer console</Link>
            <Link href="/farmer" className="btn btn-lg">Farmer app</Link>
          </div>
        </div>
      </Stage>
    </section>
  );
}
