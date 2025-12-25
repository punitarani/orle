import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep API routes working but favor static output for pages
  output: "standalone",
  reactCompiler: true,
  poweredByHeader: false,
  compress: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
