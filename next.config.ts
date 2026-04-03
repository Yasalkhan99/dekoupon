import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    /** Inlines route CSS as <style> to cut render-blocking .css chunk (LCP/FCP). Experimental — disable if issues. */
    inlineCss: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "uinxyahrhfvfrbdewoul.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "savingshub4u.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/**",
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [96, 128, 256, 384, 480, 640, 960],
  },
};

export default nextConfig;
