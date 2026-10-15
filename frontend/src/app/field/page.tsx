import FieldConsole from "./FieldConsole";
import { packAll } from "@/lib/engine";
import { loadEngine } from "@/lib/aws/catalog";
import { getBaseUrl } from "@/lib/baseUrl";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ crop?: string; role?: string; partner?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const initialCrop = sp.crop || "tomato";
  const initialPartner = sp.partner || "";
  const initialRole = sp.role || "";

  const { engine } = await loadEngine();
  const { crops, overview, details } = packAll(engine);
  const { url: qrBase, isLan } = await getBaseUrl();

  return (
    <FieldConsole
      crops={crops}
      details={details}
      overview={overview}
      qrBase={qrBase}
      isLan={isLan}
      initialCrop={initialCrop}
      initialPartnerId={initialPartner}
      initialRole={initialRole}
    />
  );
}
