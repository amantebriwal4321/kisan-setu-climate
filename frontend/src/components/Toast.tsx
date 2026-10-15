"use client";

import { useEffect } from "react";

export default function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      role="status"
      style={{
        position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 60,
        background: "var(--ink)", color: "#fff", padding: "12px 18px", borderRadius: 999,
        fontSize: 14, fontWeight: 600, boxShadow: "0 10px 30px rgba(20,35,26,.3)",
        display: "flex", alignItems: "center", gap: 8,
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--turmeric)" }} />
      {message}
    </div>
  );
}
