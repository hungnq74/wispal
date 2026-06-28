"use client";

import type { CSSProperties, ReactNode } from "react";
import { useWispalStore } from "@/lib/store/useWispalStore";
import { getThemePack } from "@/features/content/loader";

/**
 * Applies the active ambience. `data-theme` switches the global token set (globals.css),
 * so swapping themes recolours the whole scene — including the night-sky background, which
 * is painted on THIS wrapper so it reskins with the tokens. A theme pack may also ship a
 * `palette` of CSS-var overrides (the marketplace data seam); built-in packs leave it
 * empty and rely on the [data-theme] CSS.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const themeId = useWispalStore((s) => s.world.themeId);
  const theme = getThemePack(themeId);
  const resolvedThemeId = theme?.id ?? themeId;
  const style = (theme?.palette ?? {}) as CSSProperties;

  return (
    <div
      style={style}
      className="theme-root relative min-h-screen w-full overflow-hidden"
      data-theme={resolvedThemeId}
    >
      {children}
    </div>
  );
}
