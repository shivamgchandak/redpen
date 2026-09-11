import { callCount } from "@/lib/ai/groq";

/**
 * Logs how many model requests a piece of work made, so the cost of a
 * script or a test is visible in the server log, for example
 *   [ai] mark 66f1...: grade used 3 requests
 * Counts are per process, so overlapping runs can blur the numbers a little.
 */
export async function withCallCount<T>(label: string, work: () => Promise<T>): Promise<T> {
  const before = callCount().total;
  try {
    return await work();
  } finally {
    console.info(`[ai] ${label} used ${callCount().total - before} requests`);
  }
}
