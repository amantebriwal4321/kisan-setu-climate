import { NextResponse } from "next/server";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { templateExplanation, type ExplainInput } from "@/lib/explain";
import { awsClientConfig } from "@/lib/aws/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asInput(body: unknown): ExplainInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const signals = b.signals as Record<string, unknown> | undefined;
  const name = typeof b.name === "string" ? b.name.slice(0, 80) : "";
  const score = typeof b.score === "number" ? b.score : Number(b.score);
  const label = typeof b.label === "string" ? b.label.slice(0, 16) : "";
  const surplusTonnes = typeof b.surplusTonnes === "number" ? b.surplusTonnes : Number(b.surplusTonnes);
  if (!name || !Number.isFinite(score) || !label || !signals) return null;
  const arrivals = Number(signals.arrivals);
  const price = Number(signals.price);
  const season = Number(signals.season);
  if (![arrivals, price, season, surplusTonnes].every(Number.isFinite)) return null;
  return { name, score, label, surplusTonnes, signals: { arrivals, price, season } };
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const input = asInput(raw);
  if (!input) return NextResponse.json({ error: "missing score fields" }, { status: 400 });

  const template = templateExplanation(input);
  const modelId = process.env.BEDROCK_MODEL_ID;
  const aws = awsClientConfig(process.env.BEDROCK_REGION);
  if (!modelId || !aws) {
    return NextResponse.json({ text: template, source: "template", reason: "no-bedrock" });
  }

  const prompt = [
    "Explain this crop crash risk score in simple Hindi (Devanagari), two short sentences.",
    "Use only the numbers below. Do not add any other statistic.",
    "Say that sending the surplus to a processing unit keeps that food from rotting.",
    `Crop: ${input.name}`,
    `Score: ${input.score} out of 100`,
    `Label: ${input.label}`,
    `Surplus tonnes in this series: ${input.surplusTonnes}`,
    `Arrivals signal: ${Math.round(input.signals.arrivals)}`,
    `Price signal: ${Math.round(input.signals.price)}`,
    `Season signal: ${Math.round(input.signals.season)}`,
  ].join("\n");

  try {
    const client = new BedrockRuntimeClient(aws);
    const out = await client.send(new ConverseCommand({
      modelId,
      messages: [{ role: "user", content: [{ text: prompt }] }],
      inferenceConfig: { maxTokens: 220, temperature: 0.2 },
    }));
    const text = (out.output?.message?.content ?? [])
      .map((block) => ("text" in block ? block.text : ""))
      .join("")
      .trim();
    if (!text) return NextResponse.json({ text: template, source: "template", reason: "bedrock-empty" });
    return NextResponse.json({ text, source: "bedrock" });
  } catch (err) {
    console.error("Bedrock unavailable, using Hindi template", err instanceof Error ? err.name : "error");
    return NextResponse.json({ text: template, source: "template", reason: "bedrock-error" });
  }
}
