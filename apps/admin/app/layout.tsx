import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

// Self-hosted at build time by next/font (no request to Google at runtime).
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "North Nectar Admin", template: "%s · North Nectar Admin" },
  description: "North Nectar store admin.",
  robots: { index: false, follow: false },
  icons: { icon: "/images/emblem-green.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a1a1a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-PK" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
