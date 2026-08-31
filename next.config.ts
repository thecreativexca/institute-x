import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
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
