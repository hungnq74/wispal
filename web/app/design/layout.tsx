import type { Metadata } from "next";
import "./design.css";

/**
 * The /design route hosts the living Wispal Design System. Tokens, fonts, and the ds-*
 * component classes are global (app/globals.css + root layout); this layout only adds the
 * documentation page's layout styles.
 */
export const metadata: Metadata = {
  title: "Wispal Design System",
  description: "Night Study Club — tokens, type, icons, companions, and the UI kit.",
};

export default function DesignLayout({ children }: { children: React.ReactNode }) {
  return children;
}
