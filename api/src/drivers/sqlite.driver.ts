import Database from "better-sqlite3";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import * as path from "path";
import {
  DatabaseDriver,
  ConnectionConfig,
  HealthCheckResult,
  BackupOptions,
  BackupResult,
} from "../types/database";

export class SQLiteDriver extends DatabaseDriver {
  private db: Database.Database | null = null;

  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // For SQLite, database is the file path
      this.db = new Database(this.config.database, { readonly: true });

      const version = this.db
        .prepare("SELECT sqlite_version() as version")
        .get() as { version: string };
      const latency = Date.now() - startTime;

      return {
        ok: true,
        version: version.version,
        latency,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        ok: false,
        latency,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    } finally {
      await this.close();
    }
  }

  async backup(options: BackupOptions): Promise<BackupResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const dbName = path.basename(this.config.database, ".db");
    const fileName = `${dbName}_${timestamp}.sql`;
    const uploadDir = process.env.UPLOAD_DIR || "/app/data";
    const filePath = path.join(uploadDir, fileName);

    await fs.mkdir(uploadDir, { recursive: true });

    return new Promise((resolve, reject) => {
      const args = [this.config.database, ".dump"];
      const sqlite3 = spawn("sqlite3", args);

      let sqlOutput = "";
      let errorOutput = "";

      sqlite3.stdout.on("data", (data) => {
        sqlOutput += data.toString();
      });

      sqlite3.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      sqlite3.on("close", async (code) => {
        if (code === 0) {
          try {
            await fs.writeFile(filePath, sqlOutput, "utf-8");
            const stats = await fs.stat(filePath);
            resolve({
              filePath,
              fileName,
              fileSize: stats.size,
              timestamp: new Date().toISOString(),
            });
          } catch (error) {
            reject(new Error(`Failed to write backup file: ${error}`));
          }
        } else {
          reject(new Error(`sqlite3 failed with code ${code}: ${errorOutput}`));
        }
      });

      sqlite3.on("error", (error) => {
        reject(new Error(`Failed to spawn sqlite3: ${error.message}`));
      });
    });
  }

  async restore(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [this.config.database];
      const sqlite3 = spawn("sqlite3", args);

      let errorOutput = "";

      fs.readFile(filePath, "utf-8")
        .then((sqlContent) => {
          sqlite3.stdin.write(sqlContent);
          sqlite3.stdin.end();
        })
        .catch((error) => {
          reject(new Error(`Failed to read SQL file: ${error.message}`));
          sqlite3.kill();
        });

      sqlite3.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      sqlite3.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`sqlite3 failed with code ${code}: ${errorOutput}`));
        }
      });

      sqlite3.on("error", (error) => {
        reject(new Error(`Failed to spawn sqlite3: ${error.message}`));
      });
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
