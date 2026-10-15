import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DashShell from "@/components/dash/DashShell";
import QRCodeView from "@/components/QRCodeView";
import RecordTable from "@/components/passport/RecordTable";
import PassportActions from "@/components/passport/PassportActions";
import { LEDGER, findLot, LEDGER_FILE_URL } from "@/lib/ledger/data";
import { getBaseUrl } from "@/lib/baseUrl";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lotId: string }> }): Promise<Metadata> {
  const { lotId } = await params;
  return { title: `Lot ${lotId} | Kisan Setu passport` };
}

export default async function Page({ params }: { params: Promise<{ lotId: string }> }) {
  const { lotId } = await params;
  const entry = findLot(lotId);
  if (!entry) notFound();
  const { url: base } = await getBaseUrl();
  const selfUrl = `${base}/passport/${lotId}`;
  const r = entry.record;
  return (
    <DashShell title={`Lot passport ${r.lotId}`} subtitle={`${r.tonnes} t of ${r.cropName.toLowerCase()} from ${r.village}, turned into ${r.product} at ${r.unitName}.`} active="passport">
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-5 lg:col-span-2">
          <div className="eyebrow mb-2">Record</div>
          <RecordTable record={r} />
          <div className="panel p-3 mt-4">
            <div className="eyebrow mb-1">Hash chain</div>
            <div className="mono" style={{ fontSize: 11.5, wordBreak: "break-all" }}>prev {entry.prevHash}</div>
            <div className="mono" style={{ fontSize: 11.5, wordBreak: "break-all", fontWeight: 600 }}>hash {entry.hash}</div>
          </div>
        </div>
        <div className="flex flex-col gap-5">
          <div className="card p-5 flex flex-col items-center text-center">
            <div className="eyebrow" style={{ alignSelf: "flex-start" }}>Scan to verify</div>
            <div className="my-3"><QRCodeView url={selfUrl} size={170} /></div>
            <div className="mono faint" style={{ fontSize: 10.5, wordBreak: "break-all" }}>{selfUrl}</div>
            <p className="faint" style={{ fontSize: 12, marginTop: 8 }}>Print this on the crate or the jar label.</p>
          </div>
          <div className="card p-5">
            <PassportActions chain={LEDGER.entries} lotId={r.lotId} />
          </div>
          <div className="faint" style={{ fontSize: 12.5 }}>
            <Link href="/passport" style={{ textDecoration: "underline" }}>All lots</Link>{" · "}
            <a href={LEDGER_FILE_URL} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>Raw ledger</a>{" · "}
            <Link href="/impact" style={{ textDecoration: "underline" }}>How CO2e is computed</Link>
          </div>
        </div>
      </section>
    </DashShell>
  );
}
