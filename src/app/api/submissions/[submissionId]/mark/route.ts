import { getTeacherId, unauthorized } from "@/server/session";
import { startMarking } from "@/server/marking/start";

export const dynamic = "force-dynamic";

/** Starts marking one answer sheet in the background and returns at once. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
): Promise<Response> {
  const teacherId = await getTeacherId();
  if (!teacherId) return unauthorized();

  const { submissionId } = await params;
  const result = await startMarking(teacherId, submissionId);
  return result.ok
    ? Response.json(result, { status: 202 })
    : Response.json({ error: result.error }, { status: result.status });
}
