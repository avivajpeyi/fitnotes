import type { NextConfig } from "next";

// Set NEXT_PUBLIC_BASE_PATH=/fitnotes when building for GitHub Pages
// (https://<owner>.github.io/fitnotes/). Left empty for local dev/build.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
