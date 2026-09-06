import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Cost breakdown and provider comparison now live on the dashboard.
    // The riba reflection screen is gone; its subject lives on Sharia options.
    return [
      { source: "/cost", destination: "/dashboard", permanent: true },
      { source: "/compare", destination: "/dashboard", permanent: true },
      { source: "/reflect", destination: "/sharia", permanent: true },
    ];
  },
};

export default nextConfig;
