import type { NextConfig } from "next";

// Single self-contained app — all data/logic is in-process (src/lib/engine),
// so there is no backend to proxy to. Deploys to Vercel with zero config
// (Root Directory = frontend).
const nextConfig: NextConfig = {
  // AWS SDK stays on the server. Client bundles never import it.
  serverExternalPackages: [
    "@aws-sdk/client-polly",
    "@aws-sdk/client-dynamodb",
    "@aws-sdk/lib-dynamodb",
    "@aws-sdk/client-bedrock-runtime",
  ],
};

export default nextConfig;
