import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // The office proxy clones/buffers every request body it intercepts, capped
  // at 10MB by default — too small for resource uploads (app allows up to
  // 25MB files, see getMaxResourceFileSizeMB). Without this bump, bodies over
  // 10MB are truncated and multipart FormData parsing fails.
  experimental: {
    proxyClientMaxBodySize: "30mb",
  },
  // Remote image sources. Cloudinary is added now so the media phase can
  // upload/serve course thumbnails without a config change. Unsplash is used
  // for static preview/mockup imagery on the public marketing pages.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
