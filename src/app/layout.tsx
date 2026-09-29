import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import "./globals.css";

// Self-hosted variable fonts: no runtime request to Google, no layout shift.
const instrument = localFont({ src: "../fonts/instrument-sans-latin-wght-normal.woff2", variable: "--font-instrument", display: "swap" });
const newsreader = localFont({ src: "../fonts/newsreader-latin-wght-normal.woff2", variable: "--font-newsreader", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Almahy Case Desk", template: "%s | Almahy Case Desk" },
  description: "Case management and practice analytics for Almahy Legal Services.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#17212b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${instrument.variable} ${newsreader.variable}`}>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
