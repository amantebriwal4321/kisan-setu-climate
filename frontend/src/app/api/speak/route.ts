import { NextResponse } from "next/server";
import { PollyClient, SynthesizeSpeechCommand, type Engine, type VoiceId } from "@aws-sdk/client-polly";
import { awsClientConfig } from "@/lib/aws/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CHARS = 1500;

function fallback(reason: string) {
  return NextResponse.json({ fallback: true, reason });
}

export async function POST(request: Request) {
  let payload: { text?: unknown; lang?: unknown };
  try {
    payload = await request.json();
  } catch {
    return fallback("bad-json");
  }

  const lang = typeof payload.lang === "string" ? payload.lang.toLowerCase() : "";
  if (lang !== "hi" && lang !== "hi-in") return fallback("not-hindi");

  const text = typeof payload.text === "string" ? payload.text.replace(/\s+/g, " ").trim() : "";
  if (!text) return fallback("empty");

  const aws = awsClientConfig();
  if (!aws) return fallback("no-aws");

  const voiceId = (process.env.POLLY_VOICE_ID || "Kajal") as VoiceId;
  const engine = (process.env.POLLY_ENGINE || (voiceId === "Aditi" ? "standard" : "neural")) as Engine;

  try {
    const polly = new PollyClient(aws);
    const out = await polly.send(new SynthesizeSpeechCommand({
      Text: text.slice(0, MAX_CHARS),
      OutputFormat: "mp3",
      VoiceId: voiceId,
      LanguageCode: "hi-IN",
      Engine: engine,
      TextType: "text",
    }));
    if (!out.AudioStream) return fallback("polly-empty");
    const bytes = await out.AudioStream.transformToByteArray();
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "X-Polly-Voice": String(voiceId),
      },
    });
  } catch (err) {
    console.error("Polly unavailable, browser voice will be used", err instanceof Error ? err.name : "error");
    return fallback("polly-error");
  }
}
