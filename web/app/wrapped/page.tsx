import { WrappedView } from "@/features/reflection/WrappedView";

export const metadata = {
  title: "Your Year in Study — Wispal",
};

// Spec §7 lists this as the server-rendered share page. In V1 the data lives locally
// (IndexedDB), so the view hydrates client-side; the server-rendered public-share
// variant (rendered from Supabase by user id) is a documented seam for later.
export default function WrappedPage() {
  return <WrappedView />;
}
