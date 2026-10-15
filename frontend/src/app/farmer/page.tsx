import FarmerApp from "./FarmerApp";
import { loadEngine } from "@/lib/aws/catalog";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const cropParam = typeof sp.crop === "string" ? sp.crop : undefined;
  const auto = sp.auto === "1";
  const { engine } = await loadEngine();
  const incoming = cropParam ? engine.alertText(cropParam) : null;
  const sample = engine.alertText("tomato")!;
  return <FarmerApp sample={sample} incoming={incoming} auto={auto} />;
}
