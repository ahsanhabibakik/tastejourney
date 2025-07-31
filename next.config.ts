import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Essential image optimization only
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },

  // Basic security headers for APIs
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ];
  },

  // Essential external packages
  serverExternalPackages: ["cheerio", "nodemailer"],

  // Fast build optimization
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },

  // Minimal webpack config for fast builds
  webpack: (config: any) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },

  // Disable non-essential features for speed
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
