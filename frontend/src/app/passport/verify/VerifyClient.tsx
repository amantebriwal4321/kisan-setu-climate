"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import RecordTable from "@/components/passport/RecordTable";
import { entryHash, lotKey } from "@/lib/ledger/core.mjs";
import type { LedgerEntry } from "@/lib/ledger/core.d.mts";
import { fromB64Url } from "@/lib/ledger/b64";

type Check = { label: string; ok: boolean | null; detail: string };

export default function VerifyClient() {
  const sp = useSearchParams();
  const p = sp.get("p");
  const [entry, setEntry] = useState<LedgerEntry | null>(null);
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!p) { setErr("No passport in the link. Scan a lot QR, or open a published lot from the ledger."); return; }
    (async () => {
      try {
        const e = JSON.parse(fromB64Url(p)) as LedgerEntry;
        setEntry(e);
        const h = await entryHash(e.prevHash, e.record);
        const k = await lotKey(e.record);
        const res = await fetch("/api/ledger/check", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(e) });
        const j = await res.json();
        setChecks([
          { label: "Hash recomputed in this browser matches", ok: h === e.hash, detail: h },
          { label: "Duplicate guard key matches the record", ok: k === e.record.lotKey, detail: k },
          { label: j.prevHashInPublicLedger ? "Links to an entry in the public ledger" : "Links to a browser entry not yet published", ok: j.prevHashInPublicLedger ? true : null, detail: e.prevHash },
          { label: j.duplicateOf ? `Same lot already published as ${j.duplicateOf}` : "Not a duplicate of any published lot", ok: !j.duplicateOf, detail: `public head ${j.publicHead}` },
        ]);
      } catch {
        setErr("This link does not decode to a lot passport.");
      }
    })();
  }, [p]);

  if (err) return <div className="card p-5"><p>{err}</p><Link href="/passport" className="btn mt-3" style={{ display: "inline-flex" }}>Open the ledger</Link></div>;
  if (!entry) return <p>Checking…</p>;
  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="card p-5 lg:col-span-2"><RecordTable record={entry.record} /></div>
      <div className="card p-5">
        <div className="eyebrow mb-2">Checks</div>
        {!checks && <p>Hashing…</p>}
        {checks && checks.map((c, i) => (
          <div key={i} style={{ fontSize: 13, marginBottom: 10 }}>
            <span style={{ fontWeight: 700, color: c.ok === false ? "var(--alarm)" : c.ok ? "var(--brand-deep)" : "var(--ink-3)" }}>{c.ok === false ? "✗" : c.ok ? "✓" : "•"}</span> {c.label}
            <div className="mono faint" style={{ fontSize: 11, wordBreak: "break-all" }}>{c.detail}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
