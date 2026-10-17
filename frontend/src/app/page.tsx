import Link from "next/link";
import TopBar from "@/components/TopBar";
import { HeroScene, SurplusScene, CrashScene, RerouteScene, CallScene, SunriseScene } from "@/components/scroll/scenes";
import { Ribbon } from "@/components/scroll/world";
import Reveal from "@/components/Reveal";
import SchemeMap from "@/components/SchemeMap";
import { inr, num, packAll } from "@/lib/engine";
import { loadEngine } from "@/lib/aws/catalog";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { engine } = await loadEngine();
  const o = packAll(engine).overview;
  return (
    <>
      <TopBar />
      <Ribbon />
      <main className="flex-1">
        {/* The cinematic scroll story */}
        <HeroScene />
        <SurplusScene surplusTonnes={Math.round(o.kgAtRisk / 1000)} />
        <CrashScene />
        <RerouteScene rupees={o.potentialRupeesSaved} kg={o.routableKg} unitCount={o.unitsAvailable} />
        <CallScene />
        <SunriseScene />

        {/* ---- The landing that stays: what Kisan Setu actually is ---- */}
        <div className="home-wrap">
          <div className="mx-auto max-w-6xl w-full px-5">

            {/* What it is */}
            <section className="pt-20 pb-14">
              <Reveal>
                <div className="eyebrow">What Kisan Setu is</div>
                <h2 className="display" style={{ fontSize: "clamp(28px,4.4vw,46px)", lineHeight: 1.08, marginTop: 12, maxWidth: 900 }}>
                  A crop crashing, an idle unit nearby, and a buyer who wants it — all in the same district,
                  never connected. We are the <span className="mark">wire</span> that connects them, in time.
                </h2>
              </Reveal>
              <Reveal delay={90}>
                <p className="muted" style={{ fontSize: 18, lineHeight: 1.6, marginTop: 18, maxWidth: 720 }}>
                  When a harvest floods the market the price collapses and the crop that does not sell becomes food waste.
                  Kisan Setu scores that crash from public mandi signals, routes the surplus to a nearby processing
                  unit that can turn it into something that keeps, and calls the farmer in their own language with a price to accept.
                </p>
              </Reveal>
            </section>

            {/* How it works — 3 steps */}
            <section className="pb-16">
              <Reveal><div className="eyebrow" style={{ marginBottom: 18 }}>How it works</div></Reveal>
              <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
                {[
                  { n: "01", i: "📉", t: "Predict the crash", d: "We read mandi prices, daily arrivals, the harvest calendar and a live rain or heat anomaly from Open-Meteo, and score crash risk 0 to 100. Four signals anyone can check, not a black box." },
                  { n: "02", i: "🔀", t: "Route the surplus", d: "We match the surplus to nearby SHG/FPO processing units by distance and capacity: “6 units within 50 km can take 40 tonnes of tomato.”" },
                  { n: "03", i: "📞", t: "Call the farmer", d: "The farmer gets a phone call in Hindi, Kannada or English with a better price to accept. No app, no smartphone required." },
                ].map((s, k) => (
                  <Reveal key={s.n} delay={k * 90}>
                    <div className="card p-6 h-full">
                      <div className="flex items-center justify-between">
                        <div className="step-ico">{s.i}</div>
                        <div className="step-num">{s.n}</div>
                      </div>
                      <h3 className="display" style={{ fontSize: 21, marginTop: 16 }}>{s.t}</h3>
                      <p className="muted" style={{ fontSize: 15, lineHeight: 1.55, marginTop: 8 }}>{s.d}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </section>

            {/* Impact */}
            <section className="pb-16">
              <Reveal>
                <div className="card p-7">
                  <div className="eyebrow">Food waste this demo can route, {o.district}</div>
                  <div className="grid gap-6 mt-4" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
                    <Stat big={inr(o.potentialRupeesSaved)} small="farmer income if surplus is sold to units, not dumped" />
                    <Stat big={num(Math.round(o.kgAtRisk / 1000)) + " t"} small="surplus that becomes waste if left unsold" />
                    <Stat big={o.wasteReductionPct + "%"} small="of that surplus the units can take this week" />
                    <Stat big={String(o.unitsAvailable)} small="processing units in the catalog" />
                    <Stat big={num(o.farmersReached)} small="farmers reachable by one phone call" />
                  </div>
                  <p className="faint" style={{ fontSize: 13, marginTop: 14, lineHeight: 1.5, maxWidth: 760 }}>
                    Computed from this demo&apos;s Kolar arrivals series and the weekly capacity of the listed units
                    ({num(o.routableKg)} kg routable). Illustrative of the routing rule. Not a field measurement and not a national estimate.
                  </p>
                </div>
              </Reveal>
            </section>

            {/* Three portals */}
            <section className="pb-16">
              <Reveal><div className="eyebrow" style={{ marginBottom: 18 }}>Three doors into the system</div></Reveal>
              <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
                <Reveal>
                  <Link href="/admin" className="card portal-card h-full">
                    <div className="flex items-center gap-3">
                      <div className="step-ico">🛰️</div>
                      <h3 className="display" style={{ fontSize: 22 }}>Officer console</h3>
                    </div>
                    <p className="muted" style={{ fontSize: 15, lineHeight: 1.55, marginTop: 12 }}>
                      District risk at a glance. Pick a crashing crop, see where its surplus can go on the map,
                      and route it + alert farmers in one click.
                    </p>
                    <span className="link" style={{ display: "inline-block", marginTop: 14 }}>Open the console →</span>
                  </Link>
                </Reveal>
                <Reveal delay={90}>
                  <Link href="/field" className="card portal-card h-full">
                    <div className="flex items-center gap-3">
                      <div className="step-ico">👩‍🌾</div>
                      <h3 className="display" style={{ fontSize: 22 }}>Field partner</h3>
                    </div>
                    <p className="muted" style={{ fontSize: 15, lineHeight: 1.55, marginTop: 12 }}>
                      The human bridge for smallholders without smartphones. Krishi Sakhis, CSC VLEs, and FPOs work the village roster in person.
                    </p>
                    <span className="link" style={{ display: "inline-block", marginTop: 14 }}>Open field portal →</span>
                  </Link>
                </Reveal>
                <Reveal delay={180}>
                  <Link href="/farmer" className="card portal-card h-full">
                    <div className="flex items-center gap-3">
                      <div className="step-ico">🌾</div>
                      <h3 className="display" style={{ fontSize: 22 }}>Farmer app</h3>
                    </div>
                    <p className="muted" style={{ fontSize: 15, lineHeight: 1.55, marginTop: 12 }}>
                      A phone-first alert the farmer can hear read aloud in their language, with one big
                      “Accept” or walk-in confirmation at the nearest center.
                    </p>
                    <span className="link" style={{ display: "inline-block", marginTop: 14 }}>Open the app →</span>
                  </Link>
                </Reveal>
              </div>
            </section>

            {/* Scheme Map & Honest Gaps */}
            <section className="pb-16">
              <Reveal>
                <SchemeMap />
              </Reveal>
            </section>

            {/* Already funded */}
            <section className="pb-16">
              <Reveal>
                <div className="panel p-7">
                  <h3 className="display" style={{ fontSize: "clamp(22px,3vw,32px)", maxWidth: 760 }}>
                    Every piece of this is already funded by the government. We built the one thing missing —
                    the intelligence that connects them.
                  </h3>
                  <div className="flex flex-wrap gap-2.5" style={{ marginTop: 18 }}>
                    <span className="scheme">🟢 Operation Greens</span>
                    <span className="scheme">🏭 PMFME micro-units</span>
                    <span className="scheme">👥 10,000 FPO scheme</span>
                    <span className="scheme">🌾 AgriStack UFSI</span>
                    <span className="scheme">👩‍🌾 Krishi Sakhi (KSCP)</span>
                  </div>
                  <p className="faint" style={{ fontSize: 13.5, marginTop: 16, lineHeight: 1.55, maxWidth: 720 }}>
                    Operation Greens exists to stabilise tomato, onion and potato prices; PMFME funds the SHG/FPO
                    processing units; the 10,000-FPO scheme built the farmer groups; AgriStack provides verified crop-sown plots; and Krishi Sakhi provides certified women para-workers. Kisan Setu is the real-time wire that connects them.
                  </p>
                </div>
              </Reveal>
            </section>

            {/* Climate layer */}
            <section className="pb-16">
              <Reveal>
                <div className="card p-7">
                  <div className="eyebrow">Climate layer</div>
                  <h3 className="display" style={{ fontSize: "clamp(22px,3vw,30px)", lineHeight: 1.15, marginTop: 10, maxWidth: 820 }}>
                    Food loss and waste drive an estimated 8 to 10% of global greenhouse gas emissions. Every rerouted lot gets a passport, so the climate claim can be checked.
                  </h3>
                  <p className="faint" style={{ fontSize: 13.5, marginTop: 12, lineHeight: 1.55, maxWidth: 760 }}>
                    Source: UNEP Food Waste Index Report 2024. Each lot passport is SHA-256 hash chained and carries a QR anyone can verify.
                    CO2e is computed from published emission factors, shown with their source on the impact page.
                  </p>
                  <div className="flex flex-wrap gap-3" style={{ marginTop: 18 }}>
                    <Link href="/passport" className="btn btn-primary">Lot passports →</Link>
                    <Link href="/impact" className="btn">Climate impact →</Link>
                  </div>
                </div>
              </Reveal>
            </section>

            {/* Final CTA */}
            <section className="pb-24">
              <Reveal>
                <div className="text-center" style={{ maxWidth: 640, margin: "0 auto" }}>
                  <h2 className="display" style={{ fontSize: "clamp(26px,4vw,42px)", lineHeight: 1.08 }}>
                    See it work end to end.
                  </h2>
                  <p className="muted" style={{ fontSize: 17, marginTop: 12 }}>
                    Watch the 60-second flow, or open any portal and route a crop yourself.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3" style={{ marginTop: 22 }}>
                    <Link href="/flow" className="btn btn-primary btn-lg">▶ Watch the 60-second flow</Link>
                    <Link href="/admin" className="btn btn-lg">Officer console</Link>
                    <Link href="/field" className="btn btn-lg">Field partner</Link>
                    <Link href="/farmer" className="btn btn-lg">Farmer app</Link>
                    <Link href="/passport" className="btn btn-lg">Lot passports</Link>
                  </div>
                </div>
              </Reveal>
            </section>

          </div>
        </div>
      </main>
    </>
  );
}

function Stat({ big, small }: { big: string; small: string }) {
  return (
    <div>
      <div className="kpi-num" style={{ fontSize: "clamp(24px,3.4vw,32px)", color: "var(--brand-deep)" }}>{big}</div>
      <div className="faint" style={{ fontSize: 13, marginTop: 4, lineHeight: 1.4 }}>{small}</div>
    </div>
  );
}
