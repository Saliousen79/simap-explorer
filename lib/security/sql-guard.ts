import { ALLOWED_COLUMNS, SIMAP_TABLES } from "@/lib/config/simap-schema";

const FORBIDDEN_KEYWORDS = [
  "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE",
  "GRANT", "REVOKE", "CALL", "DO", "COPY", "EXECUTE", "MERGE"
];

const SQL_WORDS = new Set([
  "as", "select", "from", "where", "group", "by", "order", "limit", "and",
  "or", "not", "is", "null", "desc", "asc", "distinct", "count", "sum", "avg", "min", "max", "round",
  "coalesce", "date_trunc", "to_char", "date", "text", "numeric", "int", "any"
]);

function stripCommentsAndStrings(sql: string) {
  return sql
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/'([^']|'')*'/g, "''");
}

function normalizeTableName(identifier: string) {
  return identifier.replaceAll('"', "").toLowerCase();
}

export function assertSafeSelectQuery(sql: string) {
  const cleaned = stripCommentsAndStrings(sql).trim();

  if (!/^SELECT\b/i.test(cleaned)) {
    throw new Error("Only SELECT queries are allowed.");
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

  const tablePattern = /\b(?:FROM|JOIN)\s+((?:"[^"]+"|[a-zA-Z_]\w*)(?:\.(?:"[^"]+"|[a-zA-Z_]\w*))?)/gi;
  const usedTables = Array.from(cleaned.matchAll(tablePattern), (match) => normalizeTableName(match[1]));
  const allowedTables = new Set<string>(SIMAP_TABLES);

  if (!usedTables.length) {
    throw new Error("A query must read from a configured SIMAP table.");
  }

  for (const table of usedTables) {
    if (!allowedTables.has(table)) {
      throw new Error(`Table is not allowed: ${table}`);
    }
  }

  const limitMatch = cleaned.match(/\bLIMIT\s+(\d+)\b/i);
  if (!limitMatch || Number(limitMatch[1]) > 1000) {
    throw new Error("Queries must use LIMIT 1000 or less.");
  }

  const allowedColumns = new Set<string>(ALLOWED_COLUMNS);
  const aliases = new Set(
    Array.from(cleaned.matchAll(/\bAS\s+([a-zA-Z_]\w*)/gi), (match) => match[1].toLowerCase())
  );
  const tableParts = new Set(SIMAP_TABLES.flatMap((table) => table.split(".")));
  const identifiers = cleaned.match(/[a-zA-Z_]\w*/g) ?? [];

  for (const identifier of identifiers) {
    const token = identifier.toLowerCase();
    if (SQL_WORDS.has(token) || allowedColumns.has(token) || aliases.has(token) || tableParts.has(token)) {
      continue;
    }

    throw new Error(`Column or identifier is not allowed: ${identifier}`);
  }

  return sql;
}
