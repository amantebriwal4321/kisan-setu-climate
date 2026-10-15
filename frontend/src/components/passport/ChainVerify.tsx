"use client";

import { useState } from "react";
import { verifyChain } from "@/lib/ledger/core.mjs";
import type { LedgerEntry } from "@/lib/ledger/core.d.mts";

export default function ChainVerify({ entries }: { entries: LedgerEntry[] }) {
  const [out, setOut] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);
  async function run() {
    const v = await verifyChain(entries);
    setOk(v.ok);
    setOut(`${v.results.filter((r) => r.hashOk && r.linkOk && r.keyOk && !r.duplicateOf).length} of ${entries.length} lots verified in this browser. Head ${v.head}`);
  }
  return (
    <div className="flex flex-col gap-2">
      <button className="btn btn-primary" onClick={run} style={{ alignSelf: "flex-start" }}>Verify the whole chain</button>
      {out && (
        <div className="mono" style={{ fontSize: 12, wordBreak: "break-all", color: ok ? "var(--brand-deep)" : "var(--alarm)" }}>
          {ok ? "✓ " : "✗ "}{out}
        </div>
      )}
    </div>
  );
}
