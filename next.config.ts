import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable ESLint during builds to allow development
  eslint: {
    ignoreDuringBuilds: true,
  },
  
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

  // Turbopack configuration (stable)
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },

  // Webpack config for all builds
  webpack: (config: any) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      dns: false,
    };
    return config;
  },

  // Disable non-essential features for speed
  poweredByHeader: false,
};

export default nextConfig;
