"use client";

import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { SeriesPoint } from "@/lib/engine";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function PriceChart({ series, height = 320 }: { series: SeriesPoint[]; height?: number }) {
  const data = series.map((p) => ({ ...p, label: fmtDate(p.date) }));
  const tick = { fontSize: 11, fill: "var(--ink-2)" };
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={tick} interval={9} tickLine={false} axisLine={{ stroke: "var(--border)" }} minTickGap={20} />
        <YAxis yAxisId="price" tick={tick} tickLine={false} axisLine={false} width={38}
          label={{ value: "₹/kg", angle: -90, position: "insideLeft", fontSize: 11, fill: "var(--ink-3)" }} />
        <YAxis yAxisId="risk" orientation="right" domain={[0, 100]} tick={tick} tickLine={false} axisLine={false} width={34} />
        <YAxis yAxisId="arr" hide domain={[0, "dataMax"]} />
        <Tooltip
          contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}
          labelStyle={{ color: "var(--ink-2)", fontWeight: 600 }}
          formatter={(value, name) => {
            const raw = Array.isArray(value) ? value[0] : value;
            const v = Number(raw);
            const n = String(name);
            if (n === "Price") return [`₹${v}/kg`, n];
            if (n === "Arrivals") return [`${Math.round(v)} t`, n];
            return [`${v}`, n];
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} iconType="plainline" />
        <Area yAxisId="arr" dataKey="arrivals" name="Arrivals" fill="var(--brand)" fillOpacity={0.12} stroke="var(--brand)" strokeOpacity={0.35} strokeWidth={1} />
        <Line yAxisId="price" dataKey="price" name="Price" stroke="var(--ink)" strokeWidth={2.4} dot={false} />
        <Line yAxisId="risk" dataKey="risk" name="Crash risk" stroke="var(--alarm)" strokeWidth={2.2} strokeDasharray="4 3" dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
