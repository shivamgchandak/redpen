import { getTeacherId, unauthorized } from "@/server/session";
import { startTestRead } from "@/server/marking/start";

export const dynamic = "force-dynamic";

/** Starts reading the paper and rubric in the background and returns at once. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ testId: string }> }
): Promise<Response> {
  const teacherId = await getTeacherId();
  if (!teacherId) return unauthorized();

  const { testId } = await params;
  const result = await startTestRead(teacherId, testId);
  return result.ok
    ? Response.json(result, { status: 202 })
    : Response.json({ error: result.error }, { status: result.status });
}
