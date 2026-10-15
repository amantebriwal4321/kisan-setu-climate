"use client";

import { useEffect, useRef, useState } from "react";

function useCountUp(target: number, active: boolean, ms = 1100) {
  const [val, setVal] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (!active) {
      setVal(0);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      setVal(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, active, ms]);
  return val;
}

export default function ImpactMeter({
  active,
  rupees,
  kg,
  units,
}: {
  active: boolean;
  rupees: number;
  kg: number;
  units: number;
}) {
  const r = useCountUp(rupees, active);
  const k = useCountUp(kg, active);
  const u = useCountUp(units, active);
  const items = [
    { label: "Rupees saved vs dumping", value: "₹" + Math.round(r).toLocaleString("en-IN"), accent: "var(--brand-deep)" },
    { label: "Kg kept out of waste", value: Math.round(k).toLocaleString("en-IN"), accent: "var(--ink)" },
    { label: "Units taking the surplus", value: String(Math.round(u)), accent: "var(--ink)" },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((it) => (
        <div key={it.label} className="panel p-4 text-center">
          <div className="kpi-num" style={{ fontSize: 24, color: it.accent }}>{it.value}</div>
          <div className="faint mt-1" style={{ fontSize: 11, lineHeight: 1.3 }}>{it.label}</div>
        </div>
      ))}
    </div>
  );
}
