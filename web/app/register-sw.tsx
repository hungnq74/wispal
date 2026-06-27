"use client";

import { useEffect } from "react";

/**
 * Registers the Serwist-generated service worker (PWA: offline shell + push seam).
 * No-op in development (Serwist disables SW generation there) and where unsupported.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failure is non-fatal — the app works fully without the SW.
    });
  }, []);

  return null;
}
