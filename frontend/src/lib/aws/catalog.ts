// Server-only catalog. Reads crops and processing units from DynamoDB when
// DYNAMODB_TABLE_NAME and a region (KISAN_AWS_REGION, else AWS_REGION) are set.
// Any miss (unset env, empty table, network or auth error) returns the static seed.

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { awsClientConfig } from "@/lib/aws/config";
import { createEngine, type Engine } from "@/lib/engine";
import { CROPS, UNITS, type Crop, type SeriesRow, type Unit } from "@/lib/engine/seed";

export type CatalogSource = "dynamodb" | "static";

function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function strList(v: unknown): string[] | null {
  if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) return null;
  return v as string[];
}

function asSeries(v: unknown): SeriesRow[] | null {
  if (!Array.isArray(v) || v.length < 8) return null;
  const rows: SeriesRow[] = [];
  for (const row of v) {
    if (!row || typeof row !== "object") return null;
    const r = row as Record<string, unknown>;
    const date = str(r.date);
    const month = num(r.month);
    const price = num(r.price);
    const arrivals = num(r.arrivals);
    if (!date || month === null || price === null || arrivals === null) return null;
    rows.push({ date, month, price, arrivals });
  }
  return rows;
}

function asCrop(item: Record<string, unknown>): Crop | null {
  const slug = str(item.slug);
  const name = str(item.name);
  const nameHi = str(item.nameHi);
  const nameKn = str(item.nameKn);
  const unit = str(item.unit);
  const series = asSeries(item.series);
  if (!slug || !name || !nameHi || !nameKn || !unit || !series) return null;
  const harvestMonths = Array.isArray(item.harvestMonths)
    ? item.harvestMonths.map(num).filter((n): n is number => n !== null)
    : [];
  return { slug, name, nameHi, nameKn, unit, harvestMonths, series };
}

function asUnit(item: Record<string, unknown>): Unit | null {
  const slug = str(item.slug);
  const name = str(item.name);
  const kind = item.kind === "SHG" || item.kind === "FPO" ? item.kind : null;
  const lat = num(item.lat);
  const lng = num(item.lng);
  const crops = strList(item.crops);
  const weeklyCapacity = num(item.weeklyCapacity);
  const products = strList(item.products);
  const contact = str(item.contact);
  const collectionPoint = str(item.collectionPoint);
  const phone = str(item.phone);
  if (!slug || !name || !kind || lat === null || lng === null || !crops || weeklyCapacity === null || !products || !contact || !collectionPoint || !phone) {
    return null;
  }
  return { slug, name, kind, lat, lng, crops, weeklyCapacity, products, contact, collectionPoint, phone };
}

async function queryKind(doc: DynamoDBDocumentClient, table: string, pk: string) {
  const items: Record<string, unknown>[] = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const out = await doc.send(new QueryCommand({
      TableName: table,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: { ":pk": pk },
      ExclusiveStartKey: startKey,
    }));
    for (const item of out.Items ?? []) items.push(item as Record<string, unknown>);
    startKey = out.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (startKey);
  return items;
}

export async function loadCatalog(): Promise<{ crops: Crop[]; units: Unit[]; source: CatalogSource }> {
  const table = process.env.DYNAMODB_TABLE_NAME;
  const aws = awsClientConfig();
  if (!table || !aws) return { crops: CROPS, units: UNITS, source: "static" };

  try {
    const doc = DynamoDBDocumentClient.from(new DynamoDBClient(aws));
    const cropItems = await queryKind(doc, table, "CROP");
    const unitItems = await queryKind(doc, table, "UNIT");
    const crops = cropItems.map(asCrop).filter((c): c is Crop => c !== null);
    const units = unitItems.map(asUnit).filter((u): u is Unit => u !== null);
    if (!crops.length || !units.length) {
      console.error("DynamoDB catalog empty or invalid, using static seed");
      return { crops: CROPS, units: UNITS, source: "static" };
    }
    return { crops, units, source: "dynamodb" };
  } catch (err) {
    console.error("DynamoDB catalog unavailable, using static seed", err instanceof Error ? err.name : "error");
    return { crops: CROPS, units: UNITS, source: "static" };
  }
}

export async function loadEngine(): Promise<{ engine: Engine; source: CatalogSource }> {
  const catalog = await loadCatalog();
  return { engine: createEngine(catalog.crops, catalog.units), source: catalog.source };
}
