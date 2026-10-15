import { LEDGER, ledgerTotals } from "@/lib/ledger/data";
import { verifyChain } from "@/lib/ledger/core.mjs";

export async function GET() {
  const v = await verifyChain(LEDGER.entries);
  return Response.json({ ...LEDGER, totals: ledgerTotals(), verified: v.ok, head: v.head });
}
