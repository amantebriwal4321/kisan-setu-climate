import Link from "next/link";
import Brand from "./Brand";

export default function TopBar({ active }: { active?: "admin" | "farmer" | "flow" | "passport" | "impact" }) {
  const tabs = [
    { id: "admin", label: "Officer console", href: "/admin" },
    { id: "farmer", label: "Farmer app", href: "/farmer" },
    { id: "flow", label: "See the flow", href: "/flow" },
    { id: "passport", label: "Passports", href: "/passport" },
    { id: "impact", label: "Impact", href: "/impact" },
  ] as const;
  return (
    <header className="w-full border-b sticky top-0 z-40" style={{ background: "color-mix(in srgb, var(--ground) 88%, transparent)", backdropFilter: "blur(8px)" }}>
      <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
        <Brand />
        <nav className="flex items-center gap-1">
          {tabs.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              className="px-3.5 py-2 rounded-full"
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                background: active === t.id ? "var(--surface)" : "transparent",
                border: active === t.id ? "1px solid var(--border)" : "1px solid transparent",
                color: active === t.id ? "var(--ink)" : "var(--ink-2)",
              }}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
