import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Build ke time type errors deploy ko block nahi karenge
    ignoreBuildErrors: true,
  },
  eslint: {
    // ESLint errors ko bhi build ke waqt ignore karega
    ignoreDuringBuilds: true,
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