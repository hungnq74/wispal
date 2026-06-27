"use client";

import { useEffect } from "react";
import { useUIStore } from "@/lib/store/useUIStore";

export function Toast() {
  const toast = useUIStore((s) => s.toast);
  const clear = useUIStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clear, 2600);
    return () => clearTimeout(t);
  }, [toast, clear]);

  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div
        className="animate-pop-in rounded-full px-5 py-2.5"
        style={{ background: "var(--ink)", color: "var(--page-1)", font: "600 14px var(--font-body)", boxShadow: "var(--shadow-card)" }}
      >
        {toast}
      </div>
    </div>
  );
}
