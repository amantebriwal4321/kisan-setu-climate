import Link from "next/link";

export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Kisan Setu home">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="9" fill="var(--brand)" />
        {/* a bridge (setu) arcing over a field, with a rising sprout */}
        <path d="M6 22c4-7 16-7 20 0" stroke="#fff" strokeWidth="2.3" fill="none" strokeLinecap="round" />
        <rect x="8" y="22" width="2.3" height="4.5" rx="1" fill="#fff" />
        <rect x="21.7" y="22" width="2.3" height="4.5" rx="1" fill="#fff" />
        <circle cx="16" cy="12" r="2.3" fill="var(--turmeric)" />
      </svg>
      {!compact && (
        <div className="leading-none">
          <div className="display" style={{ fontSize: 16, fontWeight: 700 }}>Kisan Setu</div>
          <div className="faint" style={{ fontSize: 10.5, letterSpacing: "0.02em" }}>किसान सेतु</div>
        </div>
      )}
    </Link>
  );
}
