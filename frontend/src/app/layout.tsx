import type { Metadata, Viewport } from "next";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Sans_Devanagari, IBM_Plex_Mono, Noto_Sans_Kannada } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-display" });
const body = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });
const deva = IBM_Plex_Sans_Devanagari({ subsets: ["devanagari"], weight: ["400", "500", "600"], variable: "--font-deva" });
const kannada = Noto_Sans_Kannada({ subsets: ["kannada"], weight: ["400", "500", "600"], variable: "--font-kn" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Kisan Setu: route surplus before it becomes waste",
  description:
    "Score a crop crash, route the surplus to nearby processing units, and call the farmer. Food that would rot stays in the value chain.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, title: "Krishi Saathi", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0f3d24",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${deva.variable} ${kannada.variable} ${mono.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
