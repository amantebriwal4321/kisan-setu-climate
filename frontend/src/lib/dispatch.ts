// Live handshake across the Officer, Field Partner, and Farmer tiers with NO backend.
// Uses BroadcastChannel (instant, same browser, across tabs/windows) + localStorage
// (so tabs opened later still see pending alerts).
// Officer routes alert (hop: "field") -> Field Partner works the roster or relays ->
// Farmer receives call or visits center (hop: "farmer") -> Farmer/Partner accepts -> Officer gets confirmed pickup manifest.

import type { Lang } from "./i18n";
import type { FarmerRecord, PartnerRole } from "./engine/registry";

export type HopType = "field" | "farmer" | "all";

export type Dispatch = {
  id: string;
  cropSlug: string;
  cropNames: Record<Lang, string>;
  unitName: string;
  offer: number;
  crash: number;
  productName?: string;
  productPrice?: number;
  collectionPoint?: string;
  unitPhone?: string;
  farmers: number;
  texts: Record<Lang, string>;
  ts: number;
  status: "pending" | "accepted" | "declined";
  hop?: HopType;
  targetRole?: PartnerRole;
  targetFarmerId?: string;
  targetFarmer?: FarmerRecord;
  targetVillages?: string[];
};

// who accepted, for the officer's "who's coming" pickup list with AgriStack identity
export type PickupFarmer = {
  farmerId?: string;
  name: string;
  village: string;
  tonnes: number;
  method?: "call" | "visited" | "center" | "direct";
};

const CHANNEL = "kisan-setu-v2";
const LS_DISPATCH = "ks_dispatch_v2";
const LS_CONFIRM = "ks_confirm_v2";

function chan(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  return new BroadcastChannel(CHANNEL);
}

export function sendDispatch(d: Dispatch) {
  try {
    localStorage.setItem(LS_DISPATCH, JSON.stringify(d));
  } catch {}
  const c = chan();
  c?.postMessage({ type: "dispatch", payload: d });
  c?.close();
}

export function readLatestDispatch(): Dispatch | null {
  try {
    const raw = localStorage.getItem(LS_DISPATCH);
    if (!raw) return null;
    const d = JSON.parse(raw) as Dispatch;
    if (!d || !d.texts || !d.cropNames) return null;
    return d;
  } catch {
    return null;
  }
}

export function respondDispatch(
  id: string,
  status: "accepted" | "declined",
  farmer?: PickupFarmer,
  method: "call" | "visited" | "center" | "direct" = "direct"
) {
  const payload = {
    id,
    status,
    ts: Date.now(),
    farmer: farmer ? { ...farmer, method: farmer.method || method } : undefined,
  };
  try {
    localStorage.setItem(LS_CONFIRM, JSON.stringify(payload));
    const d = readLatestDispatch();
    if (d && d.id === id) {
      localStorage.setItem(LS_DISPATCH, JSON.stringify({ ...d, status }));
    }
  } catch {}
  const c = chan();
  c?.postMessage({ type: "confirm", payload });
  c?.close();
}

export function onDispatch(cb: (d: Dispatch) => void): () => void {
  const c = chan();
  if (!c) return () => {};
  const handler = (e: MessageEvent) => {
    if (e.data?.type === "dispatch") cb(e.data.payload as Dispatch);
  };
  c.addEventListener("message", handler);
  return () => {
    c.removeEventListener("message", handler);
    c.close();
  };
}

export function onConfirm(
  cb: (p: { id: string; status: string; farmer?: PickupFarmer }) => void
): () => void {
  const c = chan();
  if (!c) return () => {};
  const handler = (e: MessageEvent) => {
    if (e.data?.type === "confirm") cb(e.data.payload);
  };
  c.addEventListener("message", handler);
  return () => {
    c.removeEventListener("message", handler);
    c.close();
  };
}
