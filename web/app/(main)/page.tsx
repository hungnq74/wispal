import { AppShell } from "@/features/shell/AppShell";

// The new-tab landing. Static-first shell so it paints instantly; the companion + loop
// hydrate in the browser (local-first), keeping time-to-first-focus low (spec §1.3).
export default function Page() {
  return <AppShell />;
}
