import type { Metadata } from "next";
import { Suspense } from "react";
import DashShell from "@/components/dash/DashShell";
import VerifyClient from "./VerifyClient";

export const metadata: Metadata = { title: "Verify a lot | Kisan Setu passport" };

export default function Page() {
  return (
    <DashShell title="Verify a lot passport" subtitle="The QR carries the whole entry. This page recomputes the hash here and asks the public ledger about duplicates." active="passport">
      <Suspense fallback={<p>Loading…</p>}>
        <VerifyClient />
      </Suspense>
    </DashShell>
  );
}
