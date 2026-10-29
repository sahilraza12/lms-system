import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    agentFeedback: true,
  },
  devIndicators: false,
};

export default nextConfig;