import { fetchClimateSignal } from "@/lib/climate/openMeteo";
import { DISTRICT } from "@/lib/engine";

export const revalidate = 21600;

export async function GET(req: Request) {
  const u = new URL(req.url);
  const lat = Number(u.searchParams.get("lat") ?? DISTRICT.lat);
  const lng = Number(u.searchParams.get("lng") ?? DISTRICT.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return Response.json({ ok: false, error: "bad lat/lng" }, { status: 400 });
  }
  const s = await fetchClimateSignal(lat, lng);
  return Response.json(s, { status: s.ok ? 200 : 502 });
}
