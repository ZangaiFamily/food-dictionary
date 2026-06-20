import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath: isProduction ? "/food-dictionary" : undefined,
  assetPrefix: isProduction ? "/food-dictionary/" : undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: isProduction ? "/food-dictionary" : ""
  },
  images: {
    unoptimized: true
  }
};

export default nextConfig;
