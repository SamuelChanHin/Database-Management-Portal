import { Client } from "pg";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import {
  DatabaseDriver,
  ConnectionConfig,
  HealthCheckResult,
  BackupOptions,
  BackupResult,
} from "../types/database";

export class PostgresDriver extends DatabaseDriver {
  private client: Client | null = null;

  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      this.client = new Client({
        host: this.config.host || "localhost",
        port: this.config.port || 5432,
        database: this.config.database,
        user: this.config.user,
        password: this.config.password,
        ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 10000,
      });

      await this.client.connect();
      const result = await this.client.query("SELECT version()");
      const latency = Date.now() - startTime;

      return {
        ok: true,
        version: result.rows[0]?.version?.split(" ")[1] || "unknown",
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
    const fileName = `${this.config.database}_${timestamp}.${
      options.format === "custom" ? "dump" : "sql"
    }`;
    const uploadDir = process.env.UPLOAD_DIR || "/app/data";
    const filePath = path.join(uploadDir, fileName);

    await fs.mkdir(uploadDir, { recursive: true });

    return new Promise((resolve, reject) => {
      const args = [
        "-h",
        this.config.host || "localhost",
        "-p",
        String(this.config.port || 5432),
        "-U",
        this.config.user,
        "-d",
        this.config.database,
        "-f",
        filePath,
      ];

      if (options.format === "custom") {
        args.push("-F", "c");
      }

      const env = { ...process.env, PGPASSWORD: this.config.password };
      const pg_dump = spawn("pg_dump", args, { env });

      let errorOutput = "";

      pg_dump.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      pg_dump.on("close", async (code) => {
        if (code === 0) {
          try {
            const stats = await fs.stat(filePath);
            resolve({
              filePath,
              fileName,
              fileSize: stats.size,
              timestamp: new Date().toISOString(),
            });
          } catch (error) {
            reject(
              new Error(`Backup completed but failed to read file: ${error}`)
            );
          }
        } else {
          reject(new Error(`pg_dump failed with code ${code}: ${errorOutput}`));
        }
      });

      pg_dump.on("error", (error) => {
        reject(new Error(`Failed to spawn pg_dump: ${error.message}`));
      });
    });
  }

  async restore(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        "-h",
        this.config.host || "localhost",
        "-p",
        String(this.config.port || 5432),
        "-U",
        this.config.user,
        "-d",
        this.config.database,
      ];

      // Determine if it's a custom format or SQL
      const isCustomFormat = filePath.endsWith(".dump");
      const command = isCustomFormat ? "pg_restore" : "psql";

      if (isCustomFormat) {
        args.push("-v", filePath);
      } else {
        args.push("-f", filePath);
      }

      const env = { ...process.env, PGPASSWORD: this.config.password };
      const restoreProcess = spawn(command, args, { env });

      let errorOutput = "";

      restoreProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      restoreProcess.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(
            new Error(`${command} failed with code ${code}: ${errorOutput}`)
          );
        }
      });

      restoreProcess.on("error", (error) => {
        reject(new Error(`Failed to spawn ${command}: ${error.message}`));
      });
    });
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
    }
  }
}
