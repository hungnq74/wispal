import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wispal — Companions",
  description: "Browse the companion library, pick your study buddy, and watch them move.",
};

export default function CompanionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
