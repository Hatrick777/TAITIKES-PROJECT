import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Treat img-element warnings as non-fatal during build
    ignoreDuringBuilds: false,
    dirs: ["app", "components", "lib"],
  },
};

export default nextConfig;
