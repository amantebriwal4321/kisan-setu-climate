// Vercel reserves AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY
// and overwrites AWS_REGION at runtime. Read the KISAN_ names first.
// The standard names still work locally when the KISAN_ ones are unset.

export type AwsCredentials = { accessKeyId: string; secretAccessKey: string };

export type AwsClientConfig = {
  region: string;
  credentials?: AwsCredentials;
};

function firstSet(names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

export function awsRegion(): string | undefined {
  return firstSet(["KISAN_AWS_REGION", "AWS_REGION", "AWS_DEFAULT_REGION"]);
}

export function awsCredentials(): AwsCredentials | undefined {
  const accessKeyId = firstSet(["KISAN_AWS_ACCESS_KEY_ID", "AWS_ACCESS_KEY_ID"]);
  const secretAccessKey = firstSet(["KISAN_AWS_SECRET_ACCESS_KEY", "AWS_SECRET_ACCESS_KEY"]);
  if (!accessKeyId || !secretAccessKey) return undefined;
  return { accessKeyId, secretAccessKey };
}

// null when no region is configured, which means Polly, DynamoDB, and Bedrock stay off.
// regionOverride (BEDROCK_REGION) wins when it is non-empty.
export function awsClientConfig(regionOverride?: string): AwsClientConfig | null {
  const override = regionOverride?.trim();
  const region = override || awsRegion();
  if (!region) return null;
  const credentials = awsCredentials();
  return credentials ? { region, credentials } : { region };
}
