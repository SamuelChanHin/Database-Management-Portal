import { spawn } from "child_process";
import { promises as fs } from "fs";
import {
  DatabaseDriver,
  ConnectionConfig,
  HealthResult,
  BackupOptions,
  BackupResult,
} from "./types";
import { Client } from "pg";
import { getBinaryPath, getBinaryEnv } from "../utils/bundled-binaries";

export class PostgresDriver extends DatabaseDriver {
  private client: Client | null = null;

  async healthCheck(): Promise<HealthResult> {
    const startTime = Date.now();

    try {
      this.client = new Client({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.user,
        password: this.config.password,
        ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
      });

      await this.client.connect();
      const result = await this.client.query("SELECT version()");
      const latencyMs = Date.now() - startTime;

      return {
        ok: true,
        version: result.rows[0].version.split(",")[0],
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
      if (!this.client) {
        this.client = new Client({
          host: this.config.host,
          port: this.config.port,
          database: this.config.database,
          user: this.config.user,
          password: this.config.password,
          ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
        });
        await this.client.connect();
      }

      let sqlDump = `-- PostgreSQL Database Backup\n`;
      sqlDump += `-- Generated: ${new Date().toISOString()}\n`;
      sqlDump += `-- Database: ${this.config.database}\n\n`;

      // Get all tables
      const tablesResult = await this.client.query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename
      `);

      for (const row of tablesResult.rows) {
        const tableName = row.tablename;

        if (!options.dataOnly) {
          // Get table schema
          const schemaResult = await this.client.query(
            `
            SELECT 
              'CREATE TABLE ' || quote_ident($1) || ' (' ||
              string_agg(
                quote_ident(column_name) || ' ' || data_type ||
                CASE WHEN character_maximum_length IS NOT NULL 
                  THEN '(' || character_maximum_length || ')' 
                  ELSE '' 
                END ||
                CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
                ', '
              ) || ');' as create_statement
            FROM information_schema.columns
            WHERE table_name = $1 AND table_schema = 'public'
            GROUP BY table_name
          `,
            [tableName]
          );

          if (schemaResult.rows.length > 0) {
            sqlDump += `\n-- Table: ${tableName}\n`;
            sqlDump += `DROP TABLE IF EXISTS ${tableName} CASCADE;\n`;
            sqlDump += schemaResult.rows[0].create_statement + "\n";
          }
        }

        if (!options.schemaOnly) {
          // Get table data
          const dataResult = await this.client.query(
            `SELECT * FROM "${tableName}"`
          );

          if (dataResult.rows.length > 0) {
            sqlDump += `\n-- Data for table: ${tableName}\n`;

            for (const dataRow of dataResult.rows) {
              const columns = Object.keys(dataRow);
              const values = columns.map((col) => {
                const val = dataRow[col];
                if (val === null) return "NULL";
                if (typeof val === "number") return val;
                if (typeof val === "boolean") return val;
                return `'${String(val).replace(/'/g, "''")}'`;
              });

              sqlDump += `INSERT INTO "${tableName}" (${columns
                .map((c) => `"${c}"`)
                .join(", ")}) VALUES (${values.join(", ")});\n`;
            }
          }
        }
      }

      // Write to file
      await fs.writeFile(outputPath, sqlDump, "utf8");
      const stats = await fs.stat(outputPath);

      return {
        success: true,
        filePath: outputPath,
        sizeBytes: stats.size,
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
      if (!this.client) {
        this.client = new Client({
          host: this.config.host,
          port: this.config.port,
          database: this.config.database,
          user: this.config.user,
          password: this.config.password,
          ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
        });
        await this.client.connect();
      }

      const sqlContent = await fs.readFile(filePath, "utf8");

      // Split by semicolon and execute each statement
      const statements = sqlContent
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));

      for (const statement of statements) {
        try {
          await this.client.query(statement);
        } catch (error) {
          console.error(`Error executing statement: ${error}`);
        }
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unknown error");
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
    }
  }
}
