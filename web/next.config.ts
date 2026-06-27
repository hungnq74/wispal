import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Lint is run as a separate step (`pnpm lint`); don't block production builds on it.
  eslint: { ignoreDuringBuilds: true },
  // Heavy assets (Rive/audio/themes) are served by URL from Supabase Storage, never
  // through Next image optimization. We keep the default image config minimal and add
  // the Supabase storage host only when configured.
  images: {
    remotePatterns: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? [
          {
            protocol: "https",
            hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
          },
        ]
      : [],
  },
  // NOTE: framing is intentionally left open so the new-tab extension
  // (a chrome-extension:// origin) can embed the webapp in an iframe. Production
  // hardening: set CSP `frame-ancestors 'self' chrome-extension://<published-id>`.
};

export default nextConfig;
