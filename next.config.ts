import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Build ke time type errors deploy ko block nahi karenge
    ignoreBuildErrors: true,
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  devIndicators: false,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;