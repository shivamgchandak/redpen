import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getTeacherId } from "@/server/session";
import { ALLOWED_CONTENT_TYPES, MAX_UPLOAD_BYTES, ownsPath } from "@/lib/blob/paths";

/**
 * Issues tokens that expire quickly so the browser uploads straight to the private
 * Blob store. Files never pass through this function, which keeps uploads
 * clear of Vercel's 4.5MB request body limit.
 */
export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const teacherId = await getTeacherId();
        if (!teacherId) throw new Error("Sign in to upload files.");
        if (!ownsPath(teacherId, pathname)) throw new Error("Invalid upload path.");

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ teacherId }),
        };
      },
      // The app saves the pathname itself once upload() resolves in the
      // browser, so there is nothing to do here. (This callback cannot reach
      // localhost in development anyway.)
      onUploadCompleted: async () => {},
    });

    return Response.json(json);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Upload failed." },
      { status: 400 }
    );
  }
}
