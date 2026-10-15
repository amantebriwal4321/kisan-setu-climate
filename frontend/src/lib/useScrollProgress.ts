"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

// 0 → 1 progress of a tall section as its sticky stage is pinned through the viewport.
// rAF-throttled; recomputes on scroll + resize.
export function useScrollProgress<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const vh = window.innerHeight;
      const dist = el.offsetHeight - vh;
      const prog = dist > 0 ? (window.scrollY - el.offsetTop) / dist : 0;
      setP(Math.max(0, Math.min(1, prog)));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return [ref, p];
}

// small helpers
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
// map t in [a,b] to 0..1
export const range = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
