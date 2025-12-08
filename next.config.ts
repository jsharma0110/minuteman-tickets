import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "temrejawzlwpieepyvwq.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
    unoptimized: false,
  },
};

export default nextConfig;
