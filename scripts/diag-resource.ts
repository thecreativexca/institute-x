#!/usr/bin/env tsx
/**
 * TEMPORARY diagnostic: inspects one learning-resource record and probes the
 * three Cloudinary delivery URL variants (plain / fl_inline / fl_attachment).
 *
 * Run:
 *   node --env-file=.env.local --import tsx scripts/diag-resource.ts <resourceId>
 */

import { connectDB } from "@/lib/db/connect";
import { Resource } from "@/models/Resource";
import { withDeliveryFlag } from "@/lib/resources/cloudinary";
import { sanitizePublicIdBase, extensionForMime } from "@/lib/resources/validation";

const resourceId = process.argv[2];
if (!resourceId || !/^[0-9a-fA-F]{24}$/.test(resourceId)) {
  console.error("Pass a 24-char hex resource id.");
  process.exit(1);
}

async function probe(label: string, url: string): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  const started = Date.now();
  try {
    const res = await fetch(url, { method: "GET", signal: controller.signal });
    const ms = Date.now() - started;
    const ct = res.headers.get("content-type") ?? "(none)";
    const cd = res.headers.get("content-disposition") ?? "(none)";
    const cl = res.headers.get("content-length") ?? "(none)";
    const body = await res.arrayBuffer();
    console.log(`[${label}] status=${res.status} bytes=${body.byteLength} ms=${ms}`);
    console.log(`   content-type: ${ct}`);
    console.log(`   content-disposition: ${cd}`);
    console.log(`   content-length-hdr: ${cl}`);
  } catch (err) {
    console.log(`[${label}] FAILED ms=${Date.now() - started}`);
    console.log(`   ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  await connectDB();
  const resource = await Resource.findById(resourceId).lean();
  if (!resource) {
    console.error("Resource not found.");
    process.exit(1);
  }

  console.log("RESOURCE", {
    title: resource.title,
    mimeType: resource.mimeType,
    type: resource.type,
    access: resource.access,
    isPublished: resource.isPublished,
    fileSize: resource.fileSize,
    publicId: resource.publicId,
    fileUrl: resource.fileUrl,
  });

  const plain = resource.fileUrl;
  const inline = withDeliveryFlag(plain, "fl_inline") ?? plain;
  const ext = extensionForMime(resource.mimeType) ?? "bin";
  const base = sanitizePublicIdBase(resource.title) || "resource";
  const attachment = withDeliveryFlag(plain, `fl_attachment:${encodeURIComponent(base).replace(/'/g, "%27")}.${ext}`) ?? plain;

  await probe("plain-secure-url", plain);
  await probe("fl_inline", inline);
  await probe("fl_attachment", attachment);
  await Resource.db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
