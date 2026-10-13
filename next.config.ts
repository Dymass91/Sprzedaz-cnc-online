import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strona jest w pełni statyczna — eksport do /out pod hosting statyczny (Cloudflare Pages).
  // Cache Components / PPR są niezgodne z eksportem; wrócą wraz z backendem i serwerem.
  output: "export",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
