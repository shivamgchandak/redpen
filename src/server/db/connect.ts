import mongoose from "mongoose";

/**
 * One MongoDB connection per server process.
 *
 * Next.js dev reloads modules on every edit and serverless functions reuse a
 * warm process between requests, so the connection lives on globalThis
 * instead of module scope. Otherwise every edit or request opens a new pool
 * and the free Atlas cluster runs out of connections.
 */

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __redpenMongoose: MongooseCache | undefined;
}

const cache: MongooseCache = (globalThis.__redpenMongoose ??= {
  conn: null,
  promise: null,
});

export function hasDatabase(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add your MongoDB Atlas connection string to .env.local"
    );
  }

  cache.promise ??= mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB ?? "redpen",
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 8000,
  });

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }

  return cache.conn;
}
