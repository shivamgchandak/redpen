import { get } from "@vercel/blob";
import { type NextRequest } from "next/server";
import { getTeacherId, unauthorized } from "@/server/session";
import { ownsPath } from "@/lib/blob/paths";

/**
 * Streams a private file to its owner. Auth is checked here, right next to
 * the read, rather than in middleware, so a cached response can never reach
 * another teacher.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const teacherId = await getTeacherId();
  if (!teacherId) return unauthorized();

  const pathname = request.nextUrl.searchParams.get("pathname");
  if (!pathname) return Response.json({ error: "Missing pathname" }, { status: 400 });
  if (!ownsPath(teacherId, pathname)) return new Response("Not found", { status: 404 });

  const result = await get(pathname, {
    access: "private",
    ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
  });

  if (!result) return new Response("Not found", { status: 404 });

  if (result.statusCode === 304) {
    return new Response(null, {
      status: 304,
      headers: { ETag: result.blob.etag, "Cache-Control": "private, no-cache" },
    });
  }

  return new Response(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType,
      "X-Content-Type-Options": "nosniff",
      ETag: result.blob.etag,
      "Cache-Control": "private, no-cache",
    },
  });
}
