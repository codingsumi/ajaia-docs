import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace hoist breaks eslint-config-next's parser resolution during `next build`.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
