import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed output: "export" to enable API routes for AI tool generation
  // Static pages still work, but we can now have /api/* routes
  reactCompiler: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
