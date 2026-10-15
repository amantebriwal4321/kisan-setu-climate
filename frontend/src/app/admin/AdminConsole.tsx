"use client";

import { useEffect, useState } from "react";
import DashShell from "@/components/dash/DashShell";
import KpiCard from "@/components/dash/KpiCard";
import PriceDrop from "@/components/PriceDrop";
import SvgMap from "@/components/SvgMap";
import RiskBadge, { riskColor } from "@/components/RiskBadge";
import QRCodeView from "@/components/QRCodeView";
import ValueChain from "@/components/ValueChain";
import LivePrices, { type LivePricesData } from "@/components/LivePrices";
import Toast from "@/components/Toast";
import { sendDispatch, onConfirm, type PickupFarmer } from "@/lib/dispatch";
import {
  inr,
  num,
  alertTargets,
  partnersByRole,
  farmersForCrop,
  type CropSummary,
  type CropDetail,
  type Match,
  type MatchTotals,
  type Unit,
  type AlertBundle,
} from "@/lib/engine";
import Link from "next/link";
import LambdaRisk from "@/components/LambdaRisk";
import ExplainRisk from "@/components/ExplainRisk";
import ClimateCard from "@/components/ClimateCard";
import IssuePassport from "@/components/passport/IssuePassport";
import type { ClimateSignal } from "@/lib/climate/openMeteo";
import type { LedgerEntry } from "@/lib/ledger/core.d.mts";

type Detail = { detail: CropDetail; matches: Match[]; totals: MatchTotals; alert: AlertBundle };
type Overview = {
  district: string; cropsTracked: number; cropsAtRisk: number; kgAtRisk: number;
  routableKg: number; wasteReductionPct: number;
  potentialRupeesSaved: number; unitsAvailable: number; buyers: number; farmersReached: number;
};

export default function AdminConsole({
  overview, crops, units, details, qrBase, isLan, live, dataSource = "static", climate, ledgerEntries,
}: {
  overview: Overview; crops: CropSummary[]; units: Unit[]; details: Record<string, Detail>; qrBase: string; isLan: boolean; live: LivePricesData;
  dataSource?: "dynamodb" | "static";
  climate: ClimateSignal;
  ledgerEntries: LedgerEntry[];
}) {
  const climateValue = climate.ok ? climate.signal : null;
  const [selected, setSelected] = useState(crops[0]?.slug);
  const [routed, setRouted] = useState(false);
  const [toast, setToast] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pickups, setPickups] = useState<PickupFarmer[]>([]);
  const [cropFilter, setCropFilter] = useState<"all" | "risk" | "rising">("all");

  const d = details[selected] || details[crops[0]?.slug];
  const isRising = d.detail.risk < 40;
  const targets = alertTargets(selected);
  const farmers = targets.count;
  const topVillages = targets.byVillage.slice(0, 3).map((v) => v.village).join(", ");

  const krishiSakhis = partnersByRole("krishi_sakhi").map((p) => {
    const fList = farmersForCrop(selected, { role: "krishi_sakhi", partnerName: p.name });
    const pPickups = pickups.filter((pk) => p.villages.includes(pk.village));
    return {
      ...p,
      farmerCount: fList.length,
      pickups: pPickups,
    };
  });

  useEffect(() => { setRouted(false); setConfirmed(false); setPickups([]); }, [selected]);
  useEffect(() => onConfirm((p) => {
    if (p.status === "accepted") {
      setConfirmed(true);
      if (p.farmer) setPickups((prev) => [p.farmer!, ...prev].slice(0, 12));
    }
  }), []);

  function routeIt() {
    const best = d.matches[0];
    setRouted(true);
    setConfirmed(false);
    if (best) {
      sendDispatch({
        id: `${selected}-${Date.now()}`, cropSlug: selected, cropNames: d.alert.cropNames,
        unitName: best.unitName, offer: best.offerPrice, crash: d.totals.crashPrice, farmers,
        productName: d.alert.productName, productPrice: d.alert.productPrice,
        collectionPoint: d.alert.collectionPoint, unitPhone: d.alert.unitPhone,
        texts: d.alert.texts, ts: Date.now(), status: "pending",
        hop: "field",
        targetVillages: targets.byVillage.map((v) => v.village),
      });
    }
    setToast(`Targeted ${num(farmers)} ${d.detail.name.toLowerCase()} farmers across ${targets.byVillage.length} villages`);
  }

  const farmerUrl = `${qrBase}/farmer?crop=${selected}&auto=1`;
  const fieldUrl = `${qrBase}/field?crop=${selected}`;

  const displayedCrops = crops.filter((c) => {
    if (cropFilter === "risk") return c.risk >= 40;
    if (cropFilter === "rising") return c.risk < 40;
    return true;
  });

  return (
    <DashShell title="Overview" subtitle="Spot a crop about to crash, then route the surplus before it’s dumped." active="overview">
      {/* KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard filled label="Rupees if sold, not dumped" value={inr(overview.potentialRupeesSaved)} caption="computed from offer minus crash price" />
        <KpiCard label="Crops at risk" value={String(overview.cropsAtRisk)} caption={`of ${overview.cropsTracked} tracked`} />
        <KpiCard label="Food waste at risk" value={num(Math.round(overview.kgAtRisk / 1000)) + " t"} caption="surplus above a normal week" />
        <KpiCard label="Farmers reachable" value={num(overview.farmersReached)} caption="AgriStack registry · Kolar" />
      </section>
      <p className="faint" style={{ fontSize: 12.5, marginTop: 10, lineHeight: 1.45 }}>
        Waste figures are computed from this demo&apos;s arrivals series and the weekly capacity of the processing units. Not a field survey.
        Units can take {overview.wasteReductionPct}% of the WATCH and HIGH surplus this week ({num(overview.routableKg)} kg).
        Catalog: {dataSource === "dynamodb" ? "Amazon DynamoDB" : "local seed. Set DYNAMODB_TABLE_NAME to read DynamoDB."}
      </p>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        {/* selected crop */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <h2 className="display" style={{ fontSize: 22, fontWeight: 700 }}>{d.detail.name}</h2>
                <RiskBadge label={d.detail.label} />
                <span className="pill" style={{ fontSize: 11, background: "rgba(22,101,52,0.08)", color: "var(--brand-deep)" }}>
                  AgriStack: {num(farmers)} growers
                </span>
                {isRising && (
                  <span className="badge badge-stable" style={{ fontSize: 11 }}>
                    📈 Market Rising
                  </span>
                )}
              </div>
              {!routed ? (
                <button className="btn btn-primary" onClick={routeIt}>
                  {isRising ? "Broadcast market advisory →" : "Alert farmers & route surplus →"}
                </button>
              ) : (
                <button className="btn" onClick={() => setRouted(false)}>Reset</button>
              )}
            </div>

            <PriceDrop were={d.detail.series[0].price} now={d.detail.latestPrice} risk={d.detail.risk} />
            <LambdaRisk
              rows={d.detail.series.map((s) => ({
                date: s.date,
                month: Number(s.date.slice(5, 7)),
                price: s.price,
                arrivals: s.arrivals,
              }))}
              harvestMonths={d.detail.harvestMonths}
              localScore={d.detail.risk}
              localLabel={d.detail.label}
              signals={d.detail.signals}
              climate={climateValue}
            />
            <ClimateCard climate={climate} />
            <ExplainRisk
              name={d.detail.name}
              score={d.detail.risk}
              label={d.detail.label}
              surplusTonnes={d.detail.surplusTonnes}
              signals={d.detail.signals}
            />

            {!routed ? (
              <p style={{ fontSize: 15.5, marginTop: 18, lineHeight: 1.6 }}>
                {isRising ? (
                  <>
                    <b>Prices are rising</b> for {d.detail.name.toLowerCase()} (now ₹{d.detail.latestPrice}/kg). Market demand is strong. AgriStack crop-sown records target <b>{num(farmers)} growers</b> across {topVillages} to receive peak rate guidance and FPO processing links.
                  </>
                ) : (
                  <>
                    <b>{num(d.detail.surplusTonnes)} t</b> of {d.detail.name.toLowerCase()} is above a normal week of arrivals. Left unsold, that surplus is food waste.
                    Nearby units can take <b>{num(d.totals.kgRescued)} kg</b> this week, about <b style={{ color: "var(--brand-deep)" }}>{inr(d.totals.rupeesSaved)}</b> more than the crash price for the farmer.
                    The alert goes to <b>{num(farmers)} {d.detail.name.toLowerCase()} farmers</b> across {topVillages}.
                  </>
                )}
              </p>
            ) : (
              <p style={{ fontSize: 15.5, marginTop: 18, lineHeight: 1.6 }}>
                {isRising ? (
                  <>
                    Market intelligence dispatched to field tier. <b>{num(farmers)} {d.detail.name.toLowerCase()} farmers</b> across {topVillages} reached through Krishi Sakhis to capitalize on peak prices.
                  </>
                ) : (
                  <>
                    Dispatched to field tier. <b>{num(d.totals.tonnesMatched)} t</b> routed to <b>{d.totals.unitsEngaged}</b> units at <b style={{ color: "var(--brand-deep)" }}>₹{d.totals.offerPrice}/kg</b>. <b>{num(farmers)} {d.detail.name.toLowerCase()} farmers</b> across {topVillages} alerted through Krishi Sakhis, CSC VLEs, and FPOs.
                  </>
                )}
              </p>
            )}
          </div>

          {/* Village Field Partners Dispatch & Coverage */}
          <div className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <div className="eyebrow mb-1">Village Extension Roster · Krishi Sakhi (KSCP)</div>
                <h3 className="display" style={{ fontSize: 18, fontWeight: 700 }}>
                  Field Partner Dispatch for {d.detail.name}
                </h3>
              </div>
              {!routed ? (
                <button className="btn btn-primary" onClick={routeIt}>
                  📡 {isRising ? "Send" : "Dispatch"} {d.detail.name} {isRising ? "Advisory" : "Alert"} ({num(farmers)} growers) →
                </button>
              ) : (
                <span className="badge badge-stable" style={{ fontSize: 12, padding: "5px 12px" }}>
                  ✓ Dispatched to 3 Village Clusters
                </span>
              )}
            </div>

            <p className="faint" style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
              The APMC officer dispatches village-specific {d.detail.name.toLowerCase()} grower rosters directly to local Krishi Sakhis to contact smallholders who don&apos;t use smartphones.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {krishiSakhis.map((ks) => {
                const fieldUrl = `${qrBase}/field?crop=${selected}&partner=${ks.id}`;
                return (
                  <div
                    key={ks.id}
                    className="panel p-3.5 flex flex-col justify-between"
                    style={{
                      background: routed ? "#f0fdf4" : "var(--surface)",
                      borderColor: routed ? "#86efac" : "var(--border)",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontWeight: 700, fontSize: 14 }}>👩‍🌾 {ks.name}</span>
                        <span
                          className="pill"
                          style={{
                            fontSize: 10.5,
                            background: routed ? "var(--brand)" : "var(--dash-bg)",
                            color: routed ? "#fff" : "var(--ink-2)",
                            fontWeight: 600,
                          }}
                        >
                          {ks.farmerCount} {d.detail.name.toLowerCase()} plots
                        </span>
                      </div>
                      <div className="faint" style={{ fontSize: 11.5, lineHeight: 1.45, marginTop: 4 }}>
                        📍 <b>Villages:</b> {ks.villages.join(", ")}
                      </div>
                    </div>

                    <div style={{ marginTop: 12, paddingTop: 8, borderTop: "1px solid var(--border-light)" }}>
                      <div className="flex items-center justify-between faint" style={{ fontSize: 11.5, marginBottom: 6 }}>
                        <span>Status:</span>
                        <span style={{ fontWeight: 700, color: routed ? "var(--brand-deep)" : "var(--ink-3)" }}>
                          {routed ? `${ks.pickups.length} / ${ks.farmerCount} reached` : "Pending Dispatch"}
                        </span>
                      </div>
                      <Link
                        href={fieldUrl}
                        target="_blank"
                        className="btn btn-sm w-full"
                        style={{
                          fontSize: 11.5,
                          display: "inline-flex",
                          justifyContent: "center",
                          alignItems: "center",
                          background: "#fff",
                        }}
                      >
                        Open {ks.name.split(" ")[0]}&apos;s Field View ↗
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {routed && !isRising && (
            <IssuePassport
              publicEntries={ledgerEntries}
              crop={selected}
              cropName={d.detail.name}
              matches={d.matches}
              farmers={targets.farmers}
              riskScore={d.detail.risk}
              climateSignal={climateValue}
              qrBase={qrBase}
            />
          )}

          {routed && (
            <div className="card p-6">
              <div className="grid grid-cols-3 gap-3 mb-5">
                <Big label="Rupees saved" value={inr(d.totals.rupeesSaved)} accent="var(--brand-deep)" />
                <Big label="Kg kept out of waste" value={num(d.totals.kgRescued)} />
                <Big label="Units taking surplus" value={String(d.totals.unitsEngaged)} />
              </div>
              <div className="mb-5">
                <ValueChain crash={d.totals.crashPrice} offer={d.totals.offerPrice} productName={d.alert.productName} productPrice={d.alert.productPrice} cropSlug={d.alert.cropSlug} lang="en" />
              </div>
              {pickups.length > 0 ? (
                <div className="panel p-4 mb-4" style={{ borderColor: "var(--brand)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--brand-deep)" }}>✓ Confirmed pickups ({pickups.length})</div>
                    <div className="faint" style={{ fontSize: 11.5 }}>who to expect at the collection point</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {pickups.map((f, i) => (
                      <div key={i} className="flex items-center justify-between" style={{ fontSize: 13.5 }}>
                        <div className="flex items-center gap-2">
                          {f.farmerId && <span className="mono faint" style={{ fontSize: 11, background: "var(--dash-bg)", padding: "1px 6px", borderRadius: 4 }}>{f.farmerId}</span>}
                          <span style={{ fontWeight: 600 }}>{f.name} <span className="faint" style={{ fontWeight: 400 }}>· {f.village}</span></span>
                          {f.method && (
                            <span className="pill" style={{ fontSize: 10, padding: "2px 6px" }}>
                              {f.method === "center" ? "🏢 Center" : f.method === "visited" ? "🚶 Field visit" : "📞 Call"}
                            </span>
                          )}
                        </div>
                        <span className="mono" style={{ fontWeight: 600 }}>{f.tonnes} t</span>
                      </div>
                    ))}
                  </div>
                  <div className="faint" style={{ fontSize: 12, marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                    Committed so far: <b style={{ color: "var(--brand-deep)" }}>{pickups.reduce((a, f) => a + f.tonnes, 0).toFixed(1)} t</b> — the FPO van routes through these villages.
                  </div>
                </div>
              ) : confirmed ? (
                <div className="panel p-3 mb-4" style={{ borderColor: "var(--brand)", color: "var(--brand-deep)", fontSize: 13, fontWeight: 600 }}>
                  ✓ A farmer just accepted — the deal is confirmed.
                </div>
              ) : null}
              <SvgMap district={{ lat: d.detail.districtLat, lng: d.detail.districtLng, name: d.detail.district }} units={units} matched={d.matches} routed />
            </div>
          )}
        </div>

        {/* right column */}
        <div className="flex flex-col gap-5">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="eyebrow">Commodity Tracker · Pick One</div>
              <span className="mono faint" style={{ fontSize: 11 }}>{displayedCrops.length} crops</span>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 mb-3 flex-wrap">
              {[
                { id: "all", label: `All (${crops.length})` },
                { id: "risk", label: `⚠️ At Risk (${crops.filter((c) => c.risk >= 40).length})` },
                { id: "rising", label: `📈 Rising (${crops.filter((c) => c.risk < 40).length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCropFilter(tab.id as "all" | "risk" | "rising")}
                  className="pill"
                  style={{
                    cursor: "pointer",
                    fontSize: 11,
                    padding: "3px 8px",
                    background: cropFilter === tab.id ? "var(--ink)" : "var(--dash-bg)",
                    color: cropFilter === tab.id ? "#fff" : "var(--ink)",
                    border: "none",
                    fontWeight: 600,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-1">
              {displayedCrops.map((c) => {
                const cRising = c.risk < 40;
                const emoji =
                  c.slug === "tomato" ? "🍅" :
                  c.slug === "onion" ? "🧅" :
                  c.slug === "potato" ? "🥔" :
                  c.slug === "chilli" ? "🌶️" : "🫘";

                return (
                  <button
                    key={c.slug}
                    onClick={() => setSelected(c.slug)}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-left"
                    style={{
                      background: selected === c.slug ? "var(--dash-bg)" : "transparent",
                      border: selected === c.slug ? "1px solid var(--border)" : "1px solid transparent",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: 20 }}>{emoji}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                        <div className="faint" style={{ fontSize: 12 }}>
                          ₹{c.latestPrice}/kg {cRising ? <span style={{ color: "#166534", fontWeight: 600 }}>▲ rising</span> : null}
                        </div>
                      </div>
                    </div>
                    {cRising ? (
                      <span className="badge badge-stable" style={{ fontSize: 10, padding: "2px 8px", background: "#dcfce7", color: "#166534" }}>
                        ▲ RISING
                      </span>
                    ) : (
                      <RiskBadge label={c.label} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <LivePrices live={live} selectedCrop={selected} onSelectCrop={(slug) => setSelected(slug)} />

          <div className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="eyebrow">Field Outreach Network</div>
              <span className="badge badge-stable">3 Schemes Active</span>
            </div>
            <p className="faint" style={{ fontSize: 12.5, lineHeight: 1.45, marginBottom: 12 }}>
              Krishi Sakhis, CSC kiosks, and FPOs receive village rosters to alert farmers in person.
            </p>
            <Link href={fieldUrl} className="btn w-full" style={{ fontSize: 12.5, display: "inline-flex", justifyContent: "center" }}>
              Open Field Worker Console (/field) →
            </Link>
          </div>

          {routed && (
            <div className="card p-5 flex flex-col items-center text-center">
              <div className="eyebrow" style={{ alignSelf: "flex-start" }}>Deliver to a farmer’s phone</div>
              <div className="my-3"><QRCodeView url={farmerUrl} size={150} /></div>
              <p className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>
                Scan with a phone{isLan ? " on the same Wi-Fi" : ""} — it opens the farmer’s app, rings and speaks this alert.
              </p>
              <div className="mono faint" style={{ fontSize: 10.5, marginTop: 8, wordBreak: "break-all" }}>{farmerUrl}</div>
              <div style={{ width: "100%", marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                <Link href={fieldUrl} className="btn w-full" style={{ fontSize: 13, display: "inline-flex", justifyContent: "center" }}>
                  Open Field Partner console (/field) →
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {toast && <Toast message={toast} onDone={() => setToast("")} />}
    </DashShell>
  );
}

function Big({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="panel p-4 text-center">
      <div className="kpi-num" style={{ fontSize: 22, color: accent || "var(--ink)" }}>{value}</div>
      <div className="faint" style={{ fontSize: 11, marginTop: 3 }}>{label}</div>
    </div>
  );
}
