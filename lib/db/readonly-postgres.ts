import { Pool, types } from "pg";
import { SqlRow, SqlValue } from "@/lib/agents/types";

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
export async function runReadonlyQuery(sql: string, params: SqlValue[] = []): Promise<SqlRow[]> {
  try {
    const result = await getPool().query(sql, params);
    return result.rows as SqlRow[];
  } catch {
    const stalePool = pool;
    pool = null;
    await stalePool?.end().catch(() => undefined);
    const result = await getPool().query(sql, params);
    return result.rows as SqlRow[];
  }
}
