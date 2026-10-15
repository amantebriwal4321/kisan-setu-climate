"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  sendDispatch,
  onDispatch,
  readLatestDispatch,
  respondDispatch,
  type Dispatch,
  type PickupFarmer,
} from "@/lib/dispatch";
import {
  farmersForCrop,
  partnersByRole,
  FIELD_PARTNERS,
  type PartnerRole,
  type FarmerRecord,
  type FieldPartner,
  type CropSummary,
  type CropDetail,
  type Match,
  type MatchTotals,
  type AlertBundle,
} from "@/lib/engine";
import { stopSpeak } from "@/lib/speak";
import { STR, loadLang, type Lang, type Mode } from "@/lib/i18n";
import Toast from "@/components/Toast";
import RegistryUpload from "@/components/RegistryUpload";
import PhoneFrame from "@/components/PhoneFrame";
import IncomingCall from "@/components/IncomingCall";
import AlertCard from "@/components/AlertCard";

type Detail = { detail: CropDetail; matches: Match[]; totals: MatchTotals; alert: AlertBundle };

export default function FieldConsole({
  crops,
  details,
  overview,
  initialCrop,
  initialPartnerId,
  initialRole,
}: {
  crops: CropSummary[];
  details: Record<string, Detail>;
  overview: { district: string; farmersReached: number };
  qrBase: string;
  isLan: boolean;
  initialCrop?: string;
  initialPartnerId?: string;
  initialRole?: string;
}) {
  const [role, setRole] = useState<PartnerRole>(
    initialRole === "krishi_sakhi" || initialRole === "vle" || initialRole === "fpo"
      ? initialRole
      : "krishi_sakhi"
  );
  const [partnerId, setPartnerId] = useState<string>(initialPartnerId || "");
  const [selectedCrop, setSelectedCrop] = useState<string>(initialCrop || crops[0]?.slug || "tomato");
  const [activeDispatch, setActiveDispatch] = useState<Dispatch | null>(null);
  const [bookedFarmers, setBookedFarmers] = useState<Record<string, { tonnes: number; method: string }>>({});
  const [toast, setToast] = useState<string>("");
  const [callFarmer, setCallFarmer] = useState<FarmerRecord | null>(null);
  const [callPhase, setCallPhase] = useState<"ringing" | "details">("ringing");
  const [callMode, setCallMode] = useState<Mode>("basic"); // keypad vs smartphone in the call
  const [lang, setLang] = useState<Lang>("kn"); // default to local Kannada for field partner
  const [showDemoTools, setShowDemoTools] = useState<boolean>(false);

  useEffect(() => {
    setLang(loadLang());
    if (!initialRole && !initialPartnerId) {
      try {
        const savedRole = localStorage.getItem("ks_field_role") as PartnerRole;
        if (savedRole && (savedRole === "krishi_sakhi" || savedRole === "vle" || savedRole === "fpo")) {
          setRole(savedRole);
        }
        const savedPartner = localStorage.getItem("ks_field_partner_id");
        if (savedPartner) {
          setPartnerId(savedPartner);
        }
      } catch {}
    }

    const latest = readLatestDispatch();
    if (latest) {
      setActiveDispatch(latest);
      if (!initialCrop && latest.cropSlug) setSelectedCrop(latest.cropSlug);
    }

    return onDispatch((d) => {
      setActiveDispatch(d);
      if (d.cropSlug) setSelectedCrop(d.cropSlug);
      setToast(`🚨 New Task Assigned: ${d.cropNames.en} price crash alert in your villages!`);
    });
  }, [initialRole, initialPartnerId, initialCrop]);

  const availablePartners = partnersByRole(role);
  const currentPartner =
    availablePartners.find((p) => p.id === partnerId) || availablePartners[0] || FIELD_PARTNERS[0];

  const handleRoleChange = (newRole: PartnerRole) => {
    setRole(newRole);
    try {
      localStorage.setItem("ks_field_role", newRole);
    } catch {}
    const partners = partnersByRole(newRole);
    if (partners[0]) {
      setPartnerId(partners[0].id);
      try {
        localStorage.setItem("ks_field_partner_id", partners[0].id);
      } catch {}
    }
  };

  const handlePartnerChange = (id: string) => {
    setPartnerId(id);
    try {
      localStorage.setItem("ks_field_partner_id", id);
    } catch {}
  };

  const d = details[selectedCrop] || details[crops[0].slug];
  const assignedFarmers = farmersForCrop(selectedCrop, {
    role,
    partnerName: currentPartner.name,
  });

  const bookFarmer = (farmer: FarmerRecord, method: "call" | "visited" | "center") => {
    const estTonnes = Math.round(farmer.plotAcres * 1.5 * 10) / 10;
    const pickup: PickupFarmer = {
      farmerId: farmer.farmerId,
      name: farmer.name,
      village: farmer.village,
      tonnes: estTonnes,
      method,
    };
    setBookedFarmers((prev) => ({ ...prev, [farmer.farmerId]: { tonnes: estTonnes, method } }));
    if (activeDispatch) {
      respondDispatch(activeDispatch.id, "accepted", pickup, method);
    } else {
      respondDispatch(`${selectedCrop}-field-${Date.now()}`, "accepted", pickup, method);
    }
  };

  const handleFarmerAction = (
    farmer: FarmerRecord,
    method: "call" | "visited" | "center"
  ) => {
    if (method === "call") {
      // Show the phone interface — the farmer's ringing call, then the spoken alert.
      setCallFarmer(farmer);
      setCallPhase("ringing");
      return;
    }
    bookFarmer(farmer, method);
    if (method === "visited") setToast(`🚶 Marked ${farmer.name} visited in ${farmer.village}`);
    else setToast(`🏢 ${farmer.name} booked in-person at center`);
  };

  const closeCall = () => { stopSpeak(); setCallFarmer(null); setCallPhase("ringing"); };
  const acceptCall = () => {
    if (callFarmer) {
      bookFarmer(callFarmer, "call");
      setToast(`📞 ${callFarmer.name} accepted the offer — booked`);
    }
    closeCall();
  };

  const bookedCount = Object.keys(bookedFarmers).length;
  const totalTonnes = Object.values(bookedFarmers).reduce((a, b) => a + b.tonnes, 0);

  return (
    <div style={{ minHeight: "100vh", background: "var(--dash-bg)", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 640, background: "#fff", minHeight: "100vh", display: "flex", flexDirection: "column", boxShadow: "0 0 30px rgba(0,0,0,0.05)" }}>
        
        {/* Simple Mobile-Friendly Header */}
        <header style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", position: "sticky", top: 0, zIndex: 30 }}>
          <div className="flex items-center gap-3">
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--brand-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              {role === "krishi_sakhi" ? "👩‍🌾" : role === "vle" ? "🏢" : "🤝"}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>{currentPartner.name}</div>
              <div className="faint" style={{ fontSize: 12 }}>
                {role === "krishi_sakhi" ? "Krishi Sakhi (KSCP)" : role === "vle" ? "CSC VLE Center" : "FPO Coordinator"} · {currentPartner.villages.join(", ")}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDemoTools(!showDemoTools)}
              className="pill"
              style={{ fontSize: 11, cursor: "pointer", background: showDemoTools ? "var(--brand)" : "var(--dash-bg)", color: showDemoTools ? "#fff" : "var(--ink-2)", border: "1px solid var(--border)" }}
              title="Switch demo worker profile for presentation"
            >
              Demo Profile ▾
            </button>
            <Link href="/admin" className="pill" style={{ fontSize: 11 }}>
              Officer →
            </Link>
          </div>
        </header>

        {/* Demo Switcher Drawer (Hidden by default for simplicity, openable during a demo) */}
        {showDemoTools && (
          <div style={{ padding: "14px 20px", background: "var(--dash-bg)", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontWeight: 600, fontSize: 12 }}>Switch Presentation Persona:</span>
              <button onClick={() => setShowDemoTools(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12 }} className="faint">✕ close</button>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => handleRoleChange("krishi_sakhi")}
                className="btn"
                style={{ fontSize: 11.5, padding: "4px 8px", background: role === "krishi_sakhi" ? "var(--brand)" : "#fff", color: role === "krishi_sakhi" ? "#fff" : "var(--ink)" }}
              >
                Krishi Sakhi
              </button>
              <button
                onClick={() => handleRoleChange("vle")}
                className="btn"
                style={{ fontSize: 11.5, padding: "4px 8px", background: role === "vle" ? "var(--brand)" : "#fff", color: role === "vle" ? "#fff" : "var(--ink)" }}
              >
                CSC VLE
              </button>
              <button
                onClick={() => handleRoleChange("fpo")}
                className="btn"
                style={{ fontSize: 11.5, padding: "4px 8px", background: role === "fpo" ? "var(--brand)" : "#fff", color: role === "fpo" ? "#fff" : "var(--ink)" }}
              >
                FPO Coordinator
              </button>
            </div>
            <select
              value={currentPartner.id}
              onChange={(e) => handlePartnerChange(e.target.value)}
              style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 12, background: "#fff" }}
            >
              {availablePartners.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.villages.join(", ")})</option>
              ))}
            </select>
          </div>
        )}

        <main style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          
          {/* Mission Task Card */}
          {(() => {
            const isRising = d.detail.risk < 40;
            return (
              <div
                className="card p-4"
                style={{
                  borderLeft: `5px solid ${isRising ? "var(--brand-deep)" : "var(--alarm)"}`,
                  background: "#fff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  {isRising ? (
                    <span className="pill" style={{ background: "#dcfce7", color: "#166534", fontSize: 11, fontWeight: 700, border: "1px solid #86efac" }}>
                      📈 MARKET ADVISORY: PRICES RISING
                    </span>
                  ) : (
                    <span className="pill" style={{ background: "#fef3c7", color: "#b45309", fontSize: 11, fontWeight: 700 }}>
                      🚨 ACTIVE DISTRESS ALERT FROM APMC
                    </span>
                  )}
                  <span style={{ fontWeight: 700, fontSize: 13, color: "var(--brand-deep)" }}>
                    {bookedCount} / {assignedFarmers.length} Contacted
                  </span>
                </div>

                <h2 className="display" style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                  {isRising ? `Advise ${d.detail.name} Growers on Peak Prices` : `Alert ${d.detail.name} Growers in Your Villages`}
                </h2>
                <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.5, marginTop: 4 }}>
                  {isRising ? (
                    <>
                      Mandi price is rising at <b>₹{d.alert.crash}/kg</b>. Advise farmers to sell directly at APMC for peak returns, or supply <b>{d.alert.unitName}</b> at <b style={{ color: "var(--brand-deep)" }}>₹{d.alert.offer}/kg</b> for processed chips/pickle.
                    </>
                  ) : (
                    <>
                      Mandi price is crashing at ₹{d.alert.crash}/kg. <b>{d.alert.unitName}</b> will buy directly at <b style={{ color: "var(--brand-deep)" }}>₹{d.alert.offer}/kg</b>. Drop-off: <b>{d.alert.collectionPoint}</b>.
                    </>
                  )}
                </p>

                {/* Simple Progress Bar */}
                <div style={{ height: 6, background: "var(--dash-bg)", borderRadius: 999, marginTop: 12, overflow: "hidden" }}>
                  <div style={{ width: `${assignedFarmers.length ? (bookedCount / assignedFarmers.length) * 100 : 0}%`, height: "100%", background: isRising ? "var(--brand-deep)" : "var(--brand)", transition: "width 0.3s" }} />
                </div>
                <div className="flex items-center justify-between faint mt-2" style={{ fontSize: 11.5 }}>
                  <span>{totalTonnes.toFixed(1)} tonnes {isRising ? "advised" : "confirmed for pickup van"}</span>
                  <span>Village FPO Hub</span>
                </div>

                {/* Crop Task Switcher */}
                <div className="flex items-center gap-2 pt-3 mt-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <span className="faint" style={{ fontSize: 12, fontWeight: 600 }}>Active Crop Alert:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {crops.map((c) => {
                      const active = selectedCrop === c.slug;
                      const cFarmers = farmersForCrop(c.slug, { role, partnerName: currentPartner.name });
                      const cRising = c.risk < 40;
                      const emoji =
                        c.slug === "tomato" ? "🍅" :
                        c.slug === "onion" ? "🧅" :
                        c.slug === "potato" ? "🥔" :
                        c.slug === "chilli" ? "🌶️" : "🫘";
                      return (
                        <button
                          key={c.slug}
                          onClick={() => setSelectedCrop(c.slug)}
                          className="pill"
                          style={{
                            cursor: "pointer",
                            border: active ? "1.5px solid var(--brand)" : "1px solid var(--border)",
                            background: active ? "var(--brand)" : "var(--dash-bg)",
                            color: active ? "#fff" : "var(--ink)",
                            fontWeight: 600,
                            fontSize: 12,
                            padding: "5px 10px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            transition: "all 0.15s ease",
                          }}
                        >
                          <span>{emoji}</span>
                          <span>{c.name}</span>
                          <span style={{ fontSize: 10, opacity: active ? 0.95 : 0.7 }}>
                            {cRising ? "▲" : "▼"} ({cFarmers.length})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Simple Farmer Task List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>
                Your Assigned Farmers ({assignedFarmers.length})
              </div>
              <span className="faint" style={{ fontSize: 12 }}>Tap an action below to update</span>
            </div>

            {assignedFarmers.length === 0 ? (
              <div className="panel p-6 text-center faint">
                No {d.detail.name} farmers registered in your covered villages ({currentPartner.villages.join(", ")}).
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {assignedFarmers.map((f) => {
                  const booked = bookedFarmers[f.farmerId];
                  const estTonnes = Math.round(f.plotAcres * 1.5 * 10) / 10;
                  return (
                    <div
                      key={f.farmerId}
                      className="card p-3.5 flex flex-col gap-2.5"
                      style={{
                        background: booked ? "#f0fdf4" : "#fff",
                        borderColor: booked ? "#86efac" : "var(--border)",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span style={{ fontWeight: 700, fontSize: 15 }}>{f.name}</span>
                            <span className="mono faint" style={{ fontSize: 11, background: "var(--dash-bg)", padding: "1px 5px", borderRadius: 4 }}>
                              {f.farmerId}
                            </span>
                          </div>
                          <div className="faint" style={{ fontSize: 12.5, marginTop: 2 }}>
                            📍 {f.village} · {f.plotAcres} acres · ~{estTonnes} t {d.detail.name.toLowerCase()}
                          </div>
                        </div>

                        {booked ? (
                          <span className="pill" style={{ background: "var(--brand)", color: "#fff", fontSize: 11, fontWeight: 700 }}>
                            ✓ {booked.method === "center" ? "At Center" : booked.method === "visited" ? "Visited" : "Called"} ({booked.tonnes} t)
                          </span>
                        ) : (
                          <span className="pill faint" style={{ fontSize: 11 }}>
                            Pending
                          </span>
                        )}
                      </div>

                      {/* 3 Simple Action Buttons */}
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        <button
                          onClick={() => handleFarmerAction(f, "call")}
                          className="btn"
                          style={{
                            fontSize: 12,
                            padding: "8px 6px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: 4,
                            background: booked?.method === "call" ? "var(--brand)" : "var(--dash-bg)",
                            color: booked?.method === "call" ? "#fff" : "var(--ink)",
                          }}
                        >
                          📞 Call
                        </button>
                        <button
                          onClick={() => handleFarmerAction(f, "visited")}
                          className="btn"
                          style={{
                            fontSize: 12,
                            padding: "8px 6px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: 4,
                            background: booked?.method === "visited" ? "var(--brand)" : "var(--dash-bg)",
                            color: booked?.method === "visited" ? "#fff" : "var(--ink)",
                          }}
                        >
                          🚶 Visited
                        </button>
                        <button
                          onClick={() => handleFarmerAction(f, "center")}
                          className="btn"
                          style={{
                            fontSize: 12,
                            padding: "8px 6px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: 4,
                            background: booked?.method === "center" ? "var(--brand)" : "var(--brand-bg)",
                            color: booked?.method === "center" ? "#fff" : "var(--brand-deep)",
                            fontWeight: 600,
                          }}
                        >
                          🏢 At Center
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* Reassuring Footer */}
        <footer style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", background: "var(--dash-bg)", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
          <span className="faint">Kisan Setu Field Network · Kolar</span>
          <Link href={`/farmer?crop=${selectedCrop}&auto=1`} className="link">
            Open farmer audio preview →
          </Link>
        </footer>
      </div>

      {/* Phone interface — opens when the field partner taps Call on a farmer */}
      {callFarmer && (
        <div
          onClick={closeCall}
          style={{ position: "fixed", inset: 0, background: "rgba(10,20,14,0.62)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16, gap: 12 }}
        >
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, textAlign: "center" }}>
            📞 Calling {callFarmer.name} · {callFarmer.village}
            <span style={{ opacity: 0.7, fontWeight: 400 }}> · {callFarmer.farmerId}</span>
          </div>
          {/* keypad vs smartphone toggle for the phone interface */}
          <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 8 }}>
            {(["basic", "app"] as Mode[]).map((m) => {
              const on = callMode === m;
              return (
                <button
                  key={m}
                  onClick={() => setCallMode(m)}
                  style={{
                    padding: "5px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                    border: `1px solid ${on ? "#8ed46a" : "rgba(255,255,255,0.35)"}`,
                    background: on ? "#8ed46a" : "rgba(255,255,255,0.12)",
                    color: on ? "#0a2416" : "#eafaf0",
                  }}
                >
                  {m === "basic" ? STR[lang].modeBasic : STR[lang].modeApp}
                </button>
              );
            })}
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <PhoneFrame height={520}>
              {callPhase === "ringing" ? (
                <IncomingCall cropName={d.alert.cropNames[lang]} lang={lang} onAnswer={() => setCallPhase("details")} onDecline={closeCall} />
              ) : (
                <AlertCard a={d.alert} lang={lang} status="pending" autoPlay mode={callMode} onAccept={acceptCall} onDecline={closeCall} />
              )}
            </PhoneFrame>
          </div>
          <button
            onClick={closeCall}
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 999, padding: "6px 18px", fontSize: 13, cursor: "pointer" }}
          >
            Close
          </button>
        </div>
      )}

      {toast && <Toast message={toast} onDone={() => setToast("")} />}
    </div>
  );
}
