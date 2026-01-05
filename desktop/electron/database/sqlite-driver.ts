import { promises as fs } from "fs";
import {
  DatabaseDriver,
  ConnectionConfig,
  HealthResult,
  BackupOptions,
  BackupResult,
} from "./types";
import Database from "better-sqlite3";

export class SQLiteDriver extends DatabaseDriver {
  private db: Database.Database | null = null;

  async healthCheck(): Promise<HealthResult> {
    const startTime = Date.now();

    try {
      this.db = new Database(this.config.filePath!, { readonly: true });
      const result = this.db
        .prepare("SELECT sqlite_version() as version")
        .get() as any;
      const latencyMs = Date.now() - startTime;

      return {
        ok: true,
        version: `SQLite ${result.version}`,
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

  async backup(
    options: BackupOptions,
    outputPath: string
  ): Promise<BackupResult> {
    try {
      if (!this.db) {
        this.db = new Database(this.config.filePath!, { readonly: true });
      }

      let sql = `-- SQLite Database Backup\n`;
      sql += `-- Database: ${this.config.filePath}\n`;
      sql += `-- Date: ${new Date().toISOString()}\n\n`;

      // Get all tables
      const tables = this.db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        )
        .all() as any[];

      for (const table of tables) {
        const tableName = table.name;

        if (!options.dataOnly) {
          // Get CREATE TABLE statement
          const schema = this.db
            .prepare(
              `SELECT sql FROM sqlite_master WHERE type='table' AND name=?`
            )
            .get(tableName) as any;

          sql += `${schema.sql};\n\n`;
        }

        if (!options.schemaOnly) {
          // Get data
          const rows = this.db.prepare(`SELECT * FROM "${tableName}"`).all();

          if (rows.length > 0) {
            for (const row of rows) {
              const values = Object.values(row as object)
                .map((v) => {
                  if (v === null) return "NULL";
                  if (typeof v === "number") return v;
                  return `'${String(v).replace(/'/g, "''")}'`;
                })
                .join(", ");

              sql += `INSERT INTO "${tableName}" VALUES (${values});\n`;
            }
            sql += "\n";
          }
        }
      }

      await fs.writeFile(outputPath, sql, "utf-8");
      const stats = await fs.stat(outputPath);

      return {
        success: true,
        filePath: outputPath,
        sizeBytes: stats.size,
        tablesCount: tables.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async restore(filePath: string): Promise<void> {
    try {
      if (!this.db) {
        this.db = new Database(this.config.filePath!);
      }

      const sql = await fs.readFile(filePath, "utf-8");

      // Execute in transaction
      this.db.exec("BEGIN TRANSACTION");

      try {
        this.db.exec(sql);
        this.db.exec("COMMIT");
      } catch (error) {
        this.db.exec("ROLLBACK");
        throw error;
      }
    } catch (error) {
      throw new Error(
        `Restore failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
