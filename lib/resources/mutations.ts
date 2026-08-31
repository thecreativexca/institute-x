import { connectDB } from "@/lib/db/connect";
import { toObjectId } from "@/lib/utils/object-id";
import { Resource } from "@/models/Resource";
import type { IResource } from "@/models/Resource";
import { RESOURCE_ERROR, ResourceError } from "./errors";
import { deleteResourceAsset } from "./cloudinary";
import type { ResourceUpdateInput } from "./validation";

/** Loads a resource document (staff context); throws NOT_FOUND when missing. */
export async function getResourceById(resourceId: string): Promise<IResource> {
  await connectDB();

  let id;
  try {
    id = toObjectId(resourceId);
  } catch {
    throw new ResourceError(RESOURCE_ERROR.NOT_FOUND, "Resource not found.");
  }

  const resource = await Resource.findById(id);
  if (!resource) {
    throw new ResourceError(RESOURCE_ERROR.NOT_FOUND, "Resource not found.");
  }
  return resource;
}

/**
 * Reusable update foundation (title, description, access, publication,
 * ordering) for the future admin resource-management screens.
 */
export async function updateResource(
  resourceId: string,
  changes: ResourceUpdateInput
): Promise<void> {
  const resource = await getResourceById(resourceId);

  // Only include fields the caller actually provided.
  const $set: Record<string, unknown> = {};
  if (changes.title !== undefined) $set.title = changes.title;
  if (changes.description !== undefined) $set.description = changes.description;
  if (changes.access !== undefined) $set.access = changes.access;
  if (changes.isPublished !== undefined) $set.isPublished = changes.isPublished;
  if (changes.order !== undefined) $set.sortOrder = changes.order;

  if (Object.keys($set).length > 0) {
    await Resource.updateOne({ _id: resource._id }, { $set });
  }
}

/**
 * Safe delete: the Cloudinary asset is removed FIRST. The MongoDB record is
 * only deleted when Cloudinary confirms ("ok" or "not found"); a failed
 * deletion keeps the record so the asset never becomes untracked.
 */
export async function deleteResource(resourceId: string): Promise<void> {
  const resource = await getResourceById(resourceId);

  const assetDeleted = await deleteResourceAsset(resource.publicId);

  if (!assetDeleted) {
    throw new ResourceError(
      RESOURCE_ERROR.DELETE_FAILED,
      "The file could not be removed from storage. The resource was kept so nothing is lost — please try again."
    );
  }

  await Resource.findByIdAndDelete(resource._id);
}
