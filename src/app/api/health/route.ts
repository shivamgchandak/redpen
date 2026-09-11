import { connectDB, hasDatabase } from "@/server/db/connect";

export const dynamic = "force-dynamic";

/**
 * Setup check: open /api/health after filling in .env.local. Reports only
 * whether each service is configured and reachable, never the values.
 */
export async function GET(): Promise<Response> {
  let database: "connected" | "missing" | "error" = "missing";
  let databaseError: string | undefined;

  if (hasDatabase()) {
    try {
      const mongoose = await connectDB();
      await mongoose.connection.db?.admin().ping();
      database = "connected";
    } catch (err) {
      database = "error";
      databaseError = err instanceof Error ? err.message.split("\n")[0] : "Unknown error";
    }
  }

  const checks = {
    database,
    ...(databaseError ? { databaseError } : {}),
    auth: Boolean(process.env.AUTH_SECRET && process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
    blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID),
    groq: Boolean(process.env.GROQ_API_KEY),
  };

  const ok = checks.database === "connected" && checks.auth && checks.blob && checks.groq;
  return Response.json({ ok, ...checks }, { status: ok ? 200 : 503 });
}
