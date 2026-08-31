import { NextRequest, NextResponse } from "next/server";

import { resourceIdParamSchema, resourceUpdateSchema } from "@/lib/resources/validation";
import { deleteResource, updateResource } from "@/lib/resources/mutations";
import {
  requireResourceManagerOrResponse,
  toResourceErrorResponse,
} from "@/lib/resources/http";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ resourceId: string }> };

/**
 * PATCH /api/office/resources/[resourceId] — update foundation for the
 * future admin resource screens (title, description, access, publish, order).
 */
export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const auth = await requireResourceManagerOrResponse();
  if ("response" in auth) return auth.response;

  const parsedParams = await ctx.params;
  const route = resourceIdParamSchema.safeParse(parsedParams);
  if (!route.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request." },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request." },
      { status: 400 }
    );
  }

  const changes = resourceUpdateSchema.safeParse(body);
  if (!changes.success) {
    return NextResponse.json(
      { success: false, error: "Invalid resource changes." },
      { status: 400 }
    );
  }

  try {
    await updateResource(route.data.resourceId, changes.data);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return toResourceErrorResponse(error);
  }
}

/**
 * DELETE /api/office/resources/[resourceId] — removes the Cloudinary asset
 * first; the MongoDB record is only deleted when storage deletion succeeds.
 */
export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  const auth = await requireResourceManagerOrResponse();
  if ("response" in auth) return auth.response;

  const parsedParams = await ctx.params;
  const route = resourceIdParamSchema.safeParse(parsedParams);
  if (!route.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request." },
      { status: 400 }
    );
  }

  try {
    await deleteResource(route.data.resourceId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return toResourceErrorResponse(error);
  }
}
