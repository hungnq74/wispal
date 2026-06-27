import { defineConfig } from "vite";
import { resolve } from "path";

/**
 * Builds the MV3 extension (a SEPARATE build from the Next.js webapp — Vercel can't
 * render it, spec §2). Two entries: the background service worker and the new-tab page,
 * which embeds the webapp in an iframe. The webapp URL is injected at build time.
 */
const APP_URL = process.env.WISPAL_APP_URL || "http://localhost:3000";

export default defineConfig({
  define: {
    __APP_URL__: JSON.stringify(APP_URL),
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background.ts"),
        newtab: resolve(__dirname, "newtab.html"),
        blocked: resolve(__dirname, "blocked.html"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
});
