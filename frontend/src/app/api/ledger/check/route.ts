import { LEDGER } from "@/lib/ledger/data";
import { entryHash, lotKey, verifyChain } from "@/lib/ledger/core.mjs";
import type { LotRecord } from "@/lib/ledger/core.d.mts";

// POST { record, prevHash?, hash? }
// Recomputes the lot key and, if given, the entry hash. Answers 409 when the same
// physical lot (farmer, crop, harvest date, unit) is already anchored, so the waste
// avoided can never be counted twice.
export async function POST(req: Request) {
  let body: { record?: Partial<LotRecord>; prevHash?: string; hash?: string; extraKeys?: string[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const r = body.record;
  if (!r || !r.farmerRef || !r.crop || !r.harvestDate || !r.unit) {
    return Response.json({ error: "record needs farmerRef, crop, harvestDate, unit" }, { status: 400 });
  }
  const key = await lotKey({ farmerRef: r.farmerRef, crop: r.crop, harvestDate: r.harvestDate, unit: r.unit });
  const chain = await verifyChain(LEDGER.entries);
  let hashOk: boolean | null = null;
  if (body.prevHash && body.hash) hashOk = (await entryHash(body.prevHash, r)) === body.hash;
  const prevKnown = body.prevHash ? body.prevHash === LEDGER.genesis || LEDGER.entries.some((e) => e.hash === body.prevHash) : null;
  const clash = LEDGER.entries.find((e) => e.record.lotKey === key && (!body.hash || e.hash !== body.hash));
  const res = {
    lotKey: key,
    lotKeyMatches: r.lotKey ? r.lotKey === key : null,
    hashOk,
    prevHashInPublicLedger: prevKnown,
    publicChainOk: chain.ok,
    publicHead: chain.head,
    duplicateOf: clash ? clash.record.lotId : null,
  };
  return Response.json(res, { status: clash ? 409 : 200 });
}
