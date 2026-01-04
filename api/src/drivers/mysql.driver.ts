import mysql from "mysql2/promise";
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

export class MySQLDriver extends DatabaseDriver {
  private connection: mysql.Connection | null = null;

  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      this.connection = await mysql.createConnection({
        host: this.config.host || "localhost",
        port: this.config.port || 3306,
        database: this.config.database,
        user: this.config.user,
        password: this.config.password,
        ssl: this.config.ssl ? { rejectUnauthorized: false } : undefined,
        connectTimeout: 10000,
      });

      const [rows] = await this.connection.query("SELECT VERSION() as version");
      const latency = Date.now() - startTime;
      const version = (rows as any)[0]?.version || "unknown";

      return {
        ok: true,
        version,
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
    const fileName = `${this.config.database}_${timestamp}.sql`;
    const uploadDir = process.env.UPLOAD_DIR || "/app/data";
    const filePath = path.join(uploadDir, fileName);

    await fs.mkdir(uploadDir, { recursive: true });

    return new Promise((resolve, reject) => {
      const args = [
        "-h",
        this.config.host || "localhost",
        "-P",
        String(this.config.port || 3306),
        "-u",
        this.config.user,
        `-p${this.config.password}`,
        "--single-transaction",
        "--routines",
        "--triggers",
        "--result-file=" + filePath,
        this.config.database,
      ];

      const mysqldump = spawn("mysqldump", args);

      let errorOutput = "";

      mysqldump.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      mysqldump.on("close", async (code) => {
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
          reject(
            new Error(`mysqldump failed with code ${code}: ${errorOutput}`)
          );
        }
      });

      mysqldump.on("error", (error) => {
        reject(new Error(`Failed to spawn mysqldump: ${error.message}`));
      });
    });
  }

  async restore(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        "-h",
        this.config.host || "localhost",
        "-P",
        String(this.config.port || 3306),
        "-u",
        this.config.user,
        `-p${this.config.password}`,
        this.config.database,
      ];

      const mysql = spawn("mysql", args);

      let errorOutput = "";

      fs.readFile(filePath, "utf-8")
        .then((sqlContent) => {
          mysql.stdin.write(sqlContent);
          mysql.stdin.end();
        })
        .catch((error) => {
          reject(new Error(`Failed to read SQL file: ${error.message}`));
          mysql.kill();
        });

      mysql.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      mysql.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`mysql failed with code ${code}: ${errorOutput}`));
        }
      });

      mysql.on("error", (error) => {
        reject(new Error(`Failed to spawn mysql: ${error.message}`));
      });
    });
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }
}
