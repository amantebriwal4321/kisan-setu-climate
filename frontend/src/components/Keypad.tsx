"use client";

// A basic-phone keypad. Key 1 = Accept (green), key 2 = Not now (red); the rest are
// dim and inert. This is the unambiguous "works on any keypad phone" control — the
// farmer just presses a number, exactly like an automated IVR call.
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

export default function Keypad({
  onAccept,
  onDecline,
  acceptLabel,
  declineLabel,
  scriptClass = "",
}: {
  onAccept: () => void;
  onDecline: () => void;
  acceptLabel: string;
  declineLabel: string;
  scriptClass?: string;
}) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {KEYS.map((k) => {
          const active = k === "1" || k === "2";
          const tone = k === "1" ? "var(--brand)" : k === "2" ? "var(--alarm)" : "";
          const caption = k === "1" ? acceptLabel : k === "2" ? declineLabel : "";
          return (
            <button
              key={k}
              onClick={k === "1" ? onAccept : k === "2" ? onDecline : undefined}
              disabled={!active}
              aria-label={caption ? `${k} ${caption}` : k}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 1, height: 46, borderRadius: 12, cursor: active ? "pointer" : "default",
                border: active ? `2px solid ${tone}` : "1px solid var(--border)",
                background: active ? tone : "var(--surface)",
                color: active ? "#fff" : "var(--ink-3)",
                fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18, lineHeight: 1,
                boxShadow: active ? "0 4px 12px rgba(20,35,26,.12)" : "none",
                transition: "transform .08s ease",
              }}
            >
              <span>{k}</span>
              {caption && <span className={scriptClass} style={{ fontSize: 8.5, fontWeight: 600, fontFamily: "var(--font-body)", opacity: 0.95 }}>{caption}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
