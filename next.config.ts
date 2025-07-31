import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization for external sources
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
      // Google Places API images
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
    // Optimize images for better performance
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // API configuration and security headers
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Experimental features for better performance

  serverExternalPackages: ["playwright", "puppeteer", "cheerio", "nodemailer"],
  experimental: {
    // Optimize bundle size
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },

  // Webpack configuration
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Exclude ref folder from build and watch
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/ref/**", "**/node_modules/**"],
    };

    // Handle large dependencies on server side only
    if (isServer) {
      config.externals.push({
        playwright: "playwright",
        puppeteer: "puppeteer",
        nodemailer: "nodemailer",
      });
    }

    // Optimize bundle size
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },

  // Environment variables available on client side
  env: {
    NEXT_PUBLIC_APP_NAME: "TasteJourney",
    NEXT_PUBLIC_APP_VERSION: "1.0.0",
  },

  // Redirects for better SEO
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ];
  },

  // Optimize build output for deployment
  output: process.env.NEXT_STANDALONE === "true" ? "standalone" : undefined,

  // Enable compression
  compress: true,

  // Remove powered by header for security
  poweredByHeader: false,

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
