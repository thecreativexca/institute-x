/**
 * Resource error codes. Translated to friendly HTTP responses by http.ts —
 * internal details (Cloudinary codes, stack traces) never reach the client.
 */
export const RESOURCE_ERROR = {
  NOT_FOUND: "RESOURCE_NOT_FOUND",
  NOT_ENROLLED: "RESOURCE_NOT_ENROLLED",
  NOT_PUBLISHED: "RESOURCE_NOT_PUBLISHED",
  ACCESS_DENIED: "RESOURCE_ACCESS_DENIED",
  RELATIONSHIP_INVALID: "RESOURCE_RELATIONSHIP_INVALID",
  FORBIDDEN: "RESOURCE_FORBIDDEN",
  UNAUTHORIZED: "RESOURCE_UNAUTHORIZED",
  FILE_REQUIRED: "RESOURCE_FILE_REQUIRED",
  FILE_TYPE_INVALID: "RESOURCE_FILE_TYPE_INVALID",
  FILE_TOO_LARGE: "RESOURCE_FILE_TOO_LARGE",
  FILE_EMPTY: "RESOURCE_FILE_EMPTY",
  DUPLICATE: "RESOURCE_DUPLICATE",
  UPLOAD_FAILED: "RESOURCE_UPLOAD_FAILED",
  DELETE_FAILED: "RESOURCE_DELETE_FAILED",
  INVALID_INPUT: "RESOURCE_INVALID_INPUT",
} as const;

export type ResourceErrorCode = (typeof RESOURCE_ERROR)[keyof typeof RESOURCE_ERROR];

/** Domain error thrown by the resource system on any failure. */
export class ResourceError extends Error {
  readonly code: ResourceErrorCode;

  constructor(code: ResourceErrorCode, message: string) {
    super(message);
    this.name = "ResourceError";
    this.code = code;
  }
}