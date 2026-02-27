import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';
const REPO_NAME = '/links';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isProd ? REPO_NAME : undefined,
  assetPrefix: isProd ? REPO_NAME : undefined,
  images: {
    unoptimized: true,
  },
  experimental: {
    inlineCss: true,
  },
};

export default nextConfig;
