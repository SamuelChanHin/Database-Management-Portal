import { DbType } from "./types";

/**
 * Convert SQL from one dialect to another
 * This is a simplified converter for common patterns
 */
export function convertSql(
  sql: string,
  source: DbType,
  target: DbType
): string {
  if (source === target) {
    return sql;
  }

  let converted = sql;

  // PostgreSQL → SQLite
  if (source === "postgres" && target === "sqlite") {
    // Convert SERIAL to INTEGER PRIMARY KEY AUTOINCREMENT
    converted = converted.replace(
      /SERIAL/gi,
      "INTEGER PRIMARY KEY AUTOINCREMENT"
    );

    // Convert BIGSERIAL
    converted = converted.replace(
      /BIGSERIAL/gi,
      "INTEGER PRIMARY KEY AUTOINCREMENT"
    );

    // Remove schema qualifiers
    converted = converted.replace(/public\./gi, "");

    // Convert boolean types
    converted = converted.replace(/BOOLEAN/gi, "INTEGER");

    // Convert timestamp types
    converted = converted.replace(/TIMESTAMP/gi, "TEXT");
    converted = converted.replace(/TIMESTAMPTZ/gi, "TEXT");

    // Convert TEXT[] to TEXT
    converted = converted.replace(/TEXT\[\]/gi, "TEXT");

    // Remove ONLY keyword
    converted = converted.replace(/\bONLY\b/gi, "");
  }

  // SQLite → PostgreSQL
  if (source === "sqlite" && target === "postgres") {
    // Convert AUTOINCREMENT to SERIAL
    converted = converted.replace(
      /INTEGER PRIMARY KEY AUTOINCREMENT/gi,
      "SERIAL PRIMARY KEY"
    );

    // Add IF NOT EXISTS for safety
    converted = converted.replace(
      /CREATE TABLE /gi,
      "CREATE TABLE IF NOT EXISTS "
    );
  }

  // MySQL → SQLite
  if (source === "mysql" && target === "sqlite") {
    // Convert AUTO_INCREMENT
    converted = converted.replace(/AUTO_INCREMENT/gi, "AUTOINCREMENT");

    // Remove backticks
    converted = converted.replace(/`/g, '"');

    // Convert ENGINE statements
    converted = converted.replace(/ENGINE\s*=\s*\w+/gi, "");

    // Convert DEFAULT CHARSET
    converted = converted.replace(/DEFAULT CHARSET\s*=\s*\w+/gi, "");
  }

  // PostgreSQL → MySQL
  if (source === "postgres" && target === "mysql") {
    // Convert SERIAL to AUTO_INCREMENT
    converted = converted.replace(/SERIAL/gi, "INT AUTO_INCREMENT");

    // Convert double quotes to backticks
    converted = converted.replace(/"/g, "`");

    // Convert boolean to TINYINT
    converted = converted.replace(/BOOLEAN/gi, "TINYINT(1)");
  }

  return converted;
}

/**
 * Parse SQL into individual statements
 */
export function parseSqlStatements(sql: string): string[] {
  // Simple split by semicolon, but aware of string literals
  const statements: string[] = [];
  let current = "";
  let inString = false;
  let stringChar = "";

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const prevChar = i > 0 ? sql[i - 1] : "";

    if ((char === "'" || char === '"') && prevChar !== "\\") {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
    }

    if (char === ";" && !inString) {
      if (current.trim()) {
        statements.push(current.trim());
      }
      current = "";
    } else {
      current += char;
    }
  }

  // Add last statement if exists
  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements.filter((s) => s.length > 0);
}
