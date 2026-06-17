import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath: isProduction ? "/food-dictionary" : undefined,
  assetPrefix: isProduction ? "/food-dictionary/" : undefined,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
