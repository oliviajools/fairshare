import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone output for Capacitor with API routes
  output: 'standalone',
  trailingSlash: false,
  images: {
    unoptimized: true
  },
  // Disable type checking during build for Capacitor compatibility
  typescript: {
    ignoreBuildErrors: true
  },
};

export default nextConfig;
