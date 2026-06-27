import type { Metadata, Viewport } from "next";
import { Silkscreen, Pixelify_Sans, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import { RegisterServiceWorker } from "./register-sw";

/**
 * Brand fonts, self-hosted via next/font (no runtime request to Google):
 * Silkscreen (wordmark/timer), Pixelify Sans (headings), Space Grotesk (UI/body),
 * Space Mono (captions/metadata). Exposed as CSS variables that globals.css maps to
 * --font-pixel / --font-head / --font-body / --font-mono.
 */
const silkscreen = Silkscreen({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-silkscreen", display: "swap" });
const pixelify = Pixelify_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-pixelify", display: "swap" });
const grotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-grotesk", display: "swap" });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-spacemono", display: "swap" });

export const metadata: Metadata = {
  title: "Wispal — study beside someone",
  description:
    "The study companion that lives in your new tab, studies alongside you, and refuses to burn you out.",
  manifest: "/manifest.webmanifest",
  applicationName: "Wispal",
  appleWebApp: { capable: true, title: "Wispal", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0e0c20",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${silkscreen.variable} ${pixelify.variable} ${grotesk.variable} ${spaceMono.variable}`}
    >
      <body>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
