import TopBar from "@/components/TopBar";
import FlowClient from "./FlowClient";
import { loadEngine } from "@/lib/aws/catalog";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { engine } = await loadEngine();
  const detail = engine.getCrop("tomato")!;
  const m = engine.getMatches("tomato")!;
  const a = engine.alertText("tomato")!;
  return (
    <>
      <TopBar active="flow" />
      <FlowClient detail={detail} matches={m.matches} totals={m.totals} alert={a} units={engine.units} />
    </>
  );
}
