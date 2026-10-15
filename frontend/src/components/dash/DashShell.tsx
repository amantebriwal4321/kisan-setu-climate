import Link from "next/link";
import type { ReactNode } from "react";

// A clean SaaS dashboard shell (left sidebar + top bar), styled after the reference.
export default function DashShell({
  title,
  subtitle,
  active,
  children,
}: {
  title: string;
  subtitle?: string;
  active: "overview" | "field" | "farmer" | "flow" | "passport" | "impact";
  children: ReactNode;
}) {
  return (
    <div style={{ background: "var(--dash-bg)", minHeight: "100vh", display: "flex" }}>
      {/* sidebar */}
      <aside className="hidden lg:flex" style={{ width: 236, background: "#fff", borderRight: "1px solid var(--dash-line)", flexDirection: "column", padding: "22px 16px", position: "sticky", top: 0, height: "100vh" }}>
        <Link href="/" className="flex items-center gap-2.5 px-2" style={{ marginBottom: 26 }}>
          <Logo />
          <div className="leading-none">
            <div className="display" style={{ fontSize: 16, fontWeight: 700 }}>Kisan Setu</div>
            <div className="faint" style={{ fontSize: 10 }}>Officer console</div>
          </div>
        </Link>

        <div className="eyebrow" style={{ padding: "0 8px", marginBottom: 8 }}>Menu</div>
        <nav className="flex flex-col gap-1">
          <NavItem href="/admin" label="Overview" active={active === "overview"} icon={<IconGrid />} />
          <NavItem href="/field" label="Field partner" active={active === "field"} icon={<IconUsers />} />
          <NavItem href="/flow" label="See the flow" active={active === "flow"} icon={<IconPlay />} />
          <NavItem href="/farmer" label="Farmer app" active={active === "farmer"} icon={<IconPhone />} />
          <NavItem href="/passport" label="Lot passports" active={active === "passport"} icon={<IconChain />} />
          <NavItem href="/impact" label="Climate impact" active={active === "impact"} icon={<IconLeaf />} />
        </nav>

        <div style={{ flex: 1 }} />
        <div className="panel" style={{ padding: 12, borderRadius: 12 }}>
          <div className="eyebrow" style={{ marginBottom: 4 }}>District</div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Kolar, Karnataka</div>
          <div className="faint" style={{ fontSize: 11, marginTop: 2 }}>Live monitoring</div>
        </div>
      </aside>

      {/* main */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header style={{ height: 68, borderBottom: "1px solid var(--dash-line)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "sticky", top: 0, zIndex: 20 }}>
          <div className="lg:hidden"><Logo /></div>
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full" style={{ background: "var(--dash-bg)", border: "1px solid var(--dash-line)", width: 300, maxWidth: "40vw" }}>
            <IconSearch />
            <span className="faint" style={{ fontSize: 13 }}>Search crop, unit…</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right leading-tight">
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>District Officer</div>
              <div className="faint" style={{ fontSize: 11 }}>Agriculture Dept · Kolar</div>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 999, background: "var(--brand)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>DO</div>
          </div>
        </header>

        <main style={{ padding: "24px", flex: 1 }}>
          <div style={{ marginBottom: 20 }}>
            <h1 className="display" style={{ fontSize: 26, fontWeight: 700 }}>{title}</h1>
            {subtitle && <p className="muted" style={{ fontSize: 14.5, marginTop: 4 }}>{subtitle}</p>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

function NavItem({ href, label, active, icon }: { href: string; label: string; active: boolean; icon: ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{
      background: active ? "var(--brand)" : "transparent",
      color: active ? "#fff" : "var(--ink-2)",
      fontWeight: 600, fontSize: 14,
    }}>
      <span style={{ opacity: active ? 1 : 0.7, display: "flex" }}>{icon}</span>
      {label}
    </Link>
  );
}

function Logo() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--brand)" />
      <path d="M6 22c4-7 16-7 20 0" stroke="#fff" strokeWidth="2.3" fill="none" strokeLinecap="round" />
      <rect x="8" y="22" width="2.3" height="4.5" rx="1" fill="#fff" />
      <rect x="21.7" y="22" width="2.3" height="4.5" rx="1" fill="#fff" />
      <circle cx="16" cy="12" r="2.3" fill="var(--turmeric)" />
    </svg>
  );
}

const s = { width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const IconGrid = () => (<svg viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>);
const IconPlay = () => (<svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9" /><path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" /></svg>);
const IconPhone = () => (<svg viewBox="0 0 24 24" {...s}><rect x="7" y="3" width="10" height="18" rx="2.5" /><path d="M11 18h2" /></svg>);
const IconUsers = () => (<svg viewBox="0 0 24 24" {...s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>);
const IconChain = () => (<svg viewBox="0 0 24 24" {...s}><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></svg>);
const IconLeaf = () => (<svg viewBox="0 0 24 24" {...s}><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z" /><path d="M2 21c0-3 1.9-5.4 5.1-6" /></svg>);
const IconSearch = () => (<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--ink-3)" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.2-3.2" strokeLinecap="round" /></svg>);
