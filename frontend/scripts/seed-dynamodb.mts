// Writes the same crops and processing units the app already ships
// into the DynamoDB catalog table. Run only when DYNAMODB_TABLE_NAME and
// AWS credentials are set. The Next.js app does not need this to boot.
//
// From frontend/: npm run seed:dynamo

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { awsClientConfig } from "../src/lib/aws/config.ts";
import { CROPS, UNITS } from "../src/lib/engine/seed.ts";

const table = process.env.DYNAMODB_TABLE_NAME;
const aws = awsClientConfig();

if (!table || !aws) {
  console.error("Set KISAN_AWS_REGION (or AWS_REGION) and DYNAMODB_TABLE_NAME (the CatalogTableName stack output).");
  process.exit(1);
}

const doc = DynamoDBDocumentClient.from(new DynamoDBClient(aws));

const items = [
  ...CROPS.map((c) => ({
    pk: "CROP",
    sk: c.slug,
    slug: c.slug,
    name: c.name,
    nameHi: c.nameHi,
    nameKn: c.nameKn,
    unit: c.unit,
    harvestMonths: c.harvestMonths,
    series: c.series,
  })),
  ...UNITS.map((u) => ({
    pk: "UNIT",
    sk: u.slug,
    slug: u.slug,
    name: u.name,
    kind: u.kind,
    lat: u.lat,
    lng: u.lng,
    crops: u.crops,
    weeklyCapacity: u.weeklyCapacity,
    products: u.products,
    contact: u.contact,
    collectionPoint: u.collectionPoint,
    phone: u.phone,
  })),
];

for (let i = 0; i < items.length; i += 25) {
  const chunk = items.slice(i, i + 25);
  let pending = chunk.map((Item) => ({ PutRequest: { Item } }));
  for (let attempt = 0; attempt < 5 && pending.length; attempt++) {
    const out = await doc.send(
      new BatchWriteCommand({
        RequestItems: { [table]: pending },
      })
    );
    pending = out.UnprocessedItems?.[table] ?? [];
  }
  if (pending.length) {
    console.error(`DynamoDB left ${pending.length} items unprocessed.`);
    process.exit(1);
  }
}

console.log(`Seeded ${CROPS.length} crops and ${UNITS.length} units into ${table} (${aws.region}).`);
