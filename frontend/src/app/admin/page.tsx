import AdminConsole from "./AdminConsole";
import { packAll } from "@/lib/engine";
import { loadEngine } from "@/lib/aws/catalog";
import { getBaseUrl } from "@/lib/baseUrl";
import { getLivePrices } from "@/lib/liveprices";
import { fetchClimateSignal } from "@/lib/climate/openMeteo";
import { DISTRICT } from "@/lib/engine";
import { LEDGER } from "@/lib/ledger/data";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { engine, source } = await loadEngine();
  const { crops, overview, units, details } = packAll(engine);
  const { url: qrBase, isLan } = await getBaseUrl();
  const [live, climate] = await Promise.all([getLivePrices("Tomato"), fetchClimateSignal(DISTRICT.lat, DISTRICT.lng)]);
  return (
    <AdminConsole
      overview={overview}
      crops={crops}
      units={units}
      details={details}
      qrBase={qrBase}
      isLan={isLan}
      live={live}
      dataSource={source}
      climate={climate}
      ledgerEntries={LEDGER.entries}
    />
  );
}
