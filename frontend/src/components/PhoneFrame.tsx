import type { ReactNode, CSSProperties } from "react";

export default function PhoneFrame({ children, height = 520 }: { children: ReactNode; height?: number }) {
  const frame: CSSProperties = {
    width: (height / 520) * 258,
    height,
    background: "#0b0f0c",
    borderRadius: 36,
    padding: 10,
    position: "relative",
    boxShadow: "0 18px 48px rgba(20,35,26,.28)",
    flexShrink: 0,
  };
  const notch: CSSProperties = {
    position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
    width: 100, height: 20, background: "#0b0f0c", borderRadius: 999, zIndex: 3,
  };
  const screen: CSSProperties = {
    width: "100%", height: "100%", borderRadius: 27, overflow: "hidden",
    display: "flex", flexDirection: "column", background: "#fff",
  };
  return (
    <div style={frame}>
      <div style={notch} />
      <div style={screen}>{children}</div>
    </div>
  );
}
