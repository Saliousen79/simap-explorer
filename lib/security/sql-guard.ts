import { ALLOWED_COLUMNS, SIMAP_TABLE } from "@/lib/config/simap-schema";

const FORBIDDEN_KEYWORDS = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "DROP",
  "ALTER",
  "CREATE",
  "TRUNCATE",
  "GRANT",
  "REVOKE",
  "CALL",
  "DO",
  "COPY",
  "EXECUTE"
];

const SQL_WORDS = new Set([
  "as",
  "select",
  "with",
  "from",
  "where",
  "group",
  "by",
  "order",
  "limit",
  "and",
  "or",
  "not",
  "is",
  "null",
  "desc",
  "asc",
  "count",
  "sum",
  "coalesce",
  "numeric",
  "int"
]);

function stripCommentsAndStrings(sql: string) {
  return sql
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/'([^']|'')*'/g, "''");
}

function unquoteIdentifier(identifier: string) {
  return identifier.replace(/^"|"$/g, "").toLowerCase();
}

/**
 * SQL guard = basic tool safety.
 *
 * The real security layer is still the database read-only role
 * behind DATABASE_READONLY_URL. This guard keeps generated SQL simple
 * and blocks obvious unsafe statements before the query tool is used.
 */
export function assertSafeSelectQuery(sql: string) {
  const cleaned = stripCommentsAndStrings(sql).trim();
  const normalized = cleaned.toUpperCase();

  if (!/^(SELECT|WITH)\b/.test(normalized)) {
    throw new Error("Only SELECT or WITH queries are allowed.");
  }

  if (cleaned.includes(";")) {
    throw new Error("Multiple SQL statements are not allowed.");
  }

  for (const keyword of FORBIDDEN_KEYWORDS) {
    if (new RegExp(`\\b${keyword}\\b`, "i").test(cleaned)) {
      throw new Error(`Forbidden SQL keyword: ${keyword}`);
    }
  }

  if (/\bSELECT\s+\*/i.test(cleaned) || /\.\s*\*/.test(cleaned)) {
    throw new Error("SELECT * is not allowed.");
  }

  const tableMatches = Array.from(cleaned.matchAll(/\b(?:FROM|JOIN)\s+("[^"]+"|[a-zA-Z_][\w.]*)/gi));
  if (tableMatches.length === 0) {
    throw new Error("A query must read from the configured SIMAP table.");
  }

  const allowedTable = SIMAP_TABLE.toLowerCase();
  for (const match of tableMatches) {
    const usedTable = unquoteIdentifier(match[1]);
    if (usedTable !== allowedTable) {
      throw new Error(`Only the configured SIMAP table is allowed: ${SIMAP_TABLE}`);
    }
  }

  const allowedColumns = new Set(ALLOWED_COLUMNS.map((column) => column.toLowerCase()));
  const aliases = new Set(
    Array.from(cleaned.matchAll(/\bAS\s+([a-zA-Z_][\w]*)/gi)).map((match) => match[1].toLowerCase())
  );
  const tableParts = new Set(SIMAP_TABLE.toLowerCase().split("."));
  const identifiers = cleaned.match(/[a-zA-Z_][\w]*/g) ?? [];

  for (const identifier of identifiers) {
    const token = identifier.toLowerCase();
    if (SQL_WORDS.has(token) || allowedColumns.has(token) || aliases.has(token) || tableParts.has(token)) {
      continue;
    }

    throw new Error(`Column or identifier is not allowed: ${identifier}`);
  }

  return sql;
}

