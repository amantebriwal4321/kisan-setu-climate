import { headers } from "next/headers";
import os from "os";

// Server-only. Returns a URL a PHONE can actually open:
//  - in production (Vercel): the public request host over https
//  - in local dev on localhost: the machine's LAN IP so a phone on the same Wi-Fi can reach it
function lanIp(): string | null {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const ni of ifaces[name] || []) {
      if (ni.family === "IPv4" && !ni.internal && !ni.address.startsWith("169.254")) {
        return ni.address;
      }
    }
  }
  return null;
}

export async function getBaseUrl(): Promise<{ url: string; isLan: boolean }> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") || h.get("host") || "";
    const proto = h.get("x-forwarded-proto") || "http";
    const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
    if (host && !isLocal) {
      return { url: `${proto}://${host}`, isLan: false }; // deployed / real host
    }
    // local dev → swap localhost for the LAN IP
    const ip = lanIp();
    if (ip) {
      const port = host.includes(":") ? host.split(":")[1] : "3000";
      return { url: `http://${ip}:${port}`, isLan: true };
    }
    if (host) return { url: `${proto}://${host}`, isLan: false };
  } catch {
    /* headers() unavailable */
  }
  const ip = lanIp();
  return ip ? { url: `http://${ip}:3000`, isLan: true } : { url: "http://localhost:3000", isLan: true };
}
