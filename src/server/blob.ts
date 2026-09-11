import { get } from "@vercel/blob";

/**
 * Reads a private file on the server. The vision model takes images as data
 * URLs, the same shape the pipeline already uses for pages sent from the
 * browser, so stored pages drop straight into the existing stages.
 */
export async function readBlobAsDataUrl(pathname: string): Promise<string> {
  const result = await get(pathname, { access: "private" });
  if (!result || result.statusCode !== 200 || !result.stream) {
    throw new Error(`Could not read ${pathname} from storage.`);
  }

  const bytes = Buffer.from(await new Response(result.stream).arrayBuffer());
  return `data:${result.blob.contentType};base64,${bytes.toString("base64")}`;
}
