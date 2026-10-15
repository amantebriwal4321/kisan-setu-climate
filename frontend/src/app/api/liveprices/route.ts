import { NextResponse } from "next/server";
import { getLivePrices } from "@/lib/liveprices";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const commodity = searchParams.get("commodity") || "Tomato";
  const data = await getLivePrices(commodity);
  return NextResponse.json(data);
}
