import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Cost breakdown and provider comparison now live on the dashboard.
    return [
      { source: "/cost", destination: "/dashboard", permanent: true },
      { source: "/compare", destination: "/dashboard", permanent: true },
    ];
  },
};

export default nextConfig;
