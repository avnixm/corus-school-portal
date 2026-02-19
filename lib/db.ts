import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "@/db/schema";

declare global {
  // eslint-disable-next-line no-var -- used for dev singleton
  var __dbPool: Pool | undefined;
  // eslint-disable-next-line no-var -- used for dev singleton
  var __db: ReturnType<typeof drizzle> | undefined;
}

function getDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  if (process.env.NODE_ENV === "development") {
    if (!global.__dbPool) {
      global.__dbPool = new Pool({ connectionString });
    }
    if (!global.__db) {
      global.__db = drizzle({ client: global.__dbPool, schema });
    }
    return global.__db;
  }

  const pool = new Pool({ connectionString });
  return drizzle({ client: pool, schema });
}

export const db = getDb();
