import { Pool, types } from "pg";
import { SqlRow } from "@/lib/agents/types";

types.setTypeParser(20, Number);
types.setTypeParser(1700, Number);

let pool: Pool | null = null;

function getPool() {
  const connectionString = process.env.DATABASE_READONLY_URL;

  if (!connectionString) {
    throw new Error("DATABASE_READONLY_URL is not configured.");
  }

  if (!pool) {
    const isLocalDatabase = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

    pool = new Pool({
      connectionString,
      ssl: isLocalDatabase ? undefined : { rejectUnauthorized: false }
    });
  }

  return pool;
}

/**
 * Read-only database access.
 *
 * The generated SQL is executed with DATABASE_READONLY_URL.
 * In production this points to simap_readonly_user, so the database role
 * is the real security layer and no Supabase service role key is used.
 */
export async function runReadonlyQuery(sql: string): Promise<SqlRow[]> {
  const result = await getPool().query(sql);
  return result.rows as SqlRow[];
}
