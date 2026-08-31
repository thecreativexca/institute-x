import "server-only";

import { v2 as cloudinary } from "cloudinary";

import { env } from "@/lib/config/env";

/**
 * Server-only Cloudinary configuration shared by resource and thumbnail
 * utilities. Credentials come exclusively from server env vars.
 */

let configured = false;

export function ensureConfigured(): void {
  if (configured) return;
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });
  configured = true;
}

export { cloudinary };
