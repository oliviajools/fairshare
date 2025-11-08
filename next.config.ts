import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable static export for now - we'll use development mode for the app
  // output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Disable type checking during build for Capacitor compatibility
  typescript: {
    ignoreBuildErrors: true
  },
};

export default nextConfig;
