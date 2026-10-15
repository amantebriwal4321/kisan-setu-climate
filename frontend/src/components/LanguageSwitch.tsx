"use client";

import { LANGS, type Lang } from "@/lib/i18n";

export default function LanguageSwitch({ value, onChange }: { value: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex gap-1 p-1" style={{ background: "var(--surface-2)", borderRadius: 999, width: "fit-content", border: "1px solid var(--border)" }}>
      {LANGS.map((l) => (
        <button
          key={l.id}
          onClick={() => onChange(l.id)}
          aria-pressed={value === l.id}
          style={{
            fontSize: 13, fontWeight: 600, padding: "6px 14px", borderRadius: 999, border: "none", cursor: "pointer",
            background: value === l.id ? "var(--surface)" : "transparent",
            color: value === l.id ? "var(--ink)" : "var(--ink-2)",
            boxShadow: value === l.id ? "0 1px 3px rgba(0,0,0,.08)" : "none",
          }}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
