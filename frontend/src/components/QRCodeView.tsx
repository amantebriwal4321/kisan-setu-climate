"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

// Cross-device handoff with no backend: the officer routes a crop, a QR appears, anyone
// scans it with their own phone, and that phone opens the Farmer app already ringing.
export default function QRCodeView({ url, size = 150 }: { url: string; size?: number }) {
  const [src, setSrc] = useState<string>("");
  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: size * 2, color: { dark: "#14231a", light: "#ffffff" } })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [url, size]);

  if (!src) return <div style={{ width: size, height: size, background: "var(--surface-2)", borderRadius: 12 }} />;
  return <img src={src} alt="Scan to open on a phone" width={size} height={size} style={{ borderRadius: 12, display: "block" }} />;
}
