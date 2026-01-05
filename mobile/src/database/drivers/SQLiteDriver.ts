import * as SQLite from "expo-sqlite";
import {
  DatabaseDriver,
  ConnectionConfig,
  HealthResult,
  BackupOptions,
  ProgressCallback,
} from "../types";
import { parseSqlStatements } from "../sqlConverter";

export class SQLiteDriver extends DatabaseDriver {
  private db: SQLite.SQLiteDatabase | null = null;

  async healthCheck(): Promise<HealthResult> {
    const startTime = Date.now();

    try {
      const dbPath = this.config.filePath || this.config.database;
      if (!dbPath) {
        throw new Error("No database file path provided");
      }

      this.db = await SQLite.openDatabaseAsync(dbPath);

      // Test query
      const result = await this.db.getFirstAsync(
        "SELECT sqlite_version() as version"
      );
      const latencyMs = Date.now() - startTime;

      return {
        ok: true,
        version: (result as any)?.version || "unknown",
        latencyMs,
        message: "Connected successfully",
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      return {
        ok: false,
        latencyMs,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Connection failed",
      };
    }
  }

  async listTables(): Promise<string[]> {
    if (!this.db) {
      const dbPath = this.config.filePath || this.config.database;
      if (!dbPath) throw new Error("No database path");
      this.db = await SQLite.openDatabaseAsync(dbPath);
    }

    const result = await this.db.getAllAsync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );

    return (result as any[]).map((row) => row.name);
  }

  async dumpDatabase(
    options?: BackupOptions,
    onProgress?: ProgressCallback
  ): Promise<string> {
    if (!this.db) {
      const dbPath = this.config.filePath || this.config.database;
      if (!dbPath) throw new Error("No database path");
      this.db = await SQLite.openDatabaseAsync(dbPath);
    }

    let sql = "-- SQLite Database Dump\n";
    sql += `-- Database: ${this.config.name}\n`;
    sql += `-- Date: ${new Date().toISOString()}\n\n`;

    const tables = await this.listTables();
    const totalTables = tables.length;

    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];

      if (onProgress) {
        onProgress({
          currentTable: table,
          totalTables,
          processedTables: i,
          percentage: Math.round((i / totalTables) * 100),
        });
      }

      // Get CREATE TABLE statement
      if (!options?.dataOnly) {
        const createResult = await this.db.getFirstAsync(
          `SELECT sql FROM sqlite_master WHERE type='table' AND name=?`,
          [table]
        );

        if (createResult) {
          sql += `-- Table: ${table}\n`;
          sql += `${(createResult as any).sql};\n\n`;
        }
      }

      // Get data
      if (!options?.schemaOnly) {
        const rows = await this.db.getAllAsync(`SELECT * FROM "${table}"`);

        if (rows.length > 0) {
          const columns = Object.keys(rows[0]);
          const columnNames = columns.map((c) => `"${c}"`).join(", ");

          for (const row of rows) {
            const values = columns
              .map((col) => {
                const val = (row as any)[col];
                if (val === null) return "NULL";
                if (typeof val === "string")
                  return `'${val.replace(/'/g, "''")}'`;
                return val;
              })
              .join(", ");

            sql += `INSERT INTO "${table}" (${columnNames}) VALUES (${values});\n`;
          }
          sql += "\n";
        }
      }
    }

    if (onProgress) {
      onProgress({
        totalTables,
        processedTables: totalTables,
        percentage: 100,
      });
    }

    return sql;
  }

  async restoreDatabase(
    sql: string,
    onProgress?: ProgressCallback
  ): Promise<void> {
    if (!this.db) {
      const dbPath = this.config.filePath || this.config.database;
      if (!dbPath) throw new Error("No database path");
      this.db = await SQLite.openDatabaseAsync(dbPath);
    }

    const statements = parseSqlStatements(sql);
    const totalStatements = statements.length;

    await this.db.withTransactionAsync(async () => {
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];

        if (onProgress) {
          onProgress({
            currentStatement: i + 1,
            totalStatements,
            percentage: Math.round(((i + 1) / totalStatements) * 100),
          });
        }

        // Skip comments and empty lines
        if (stmt.startsWith("--") || stmt.trim().length === 0) {
          continue;
        }

        await this.db!.execAsync(stmt);
      }
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}
