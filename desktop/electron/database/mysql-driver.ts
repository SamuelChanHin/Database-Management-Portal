import { spawn } from "child_process";
import { promises as fs } from "fs";
import {
  DatabaseDriver,
  ConnectionConfig,
  HealthResult,
  BackupOptions,
  BackupResult,
} from "./types";
import mysql from "mysql2/promise";
import { getBinaryPath, getBinaryEnv } from "../utils/bundled-binaries";

export class MySQLDriver extends DatabaseDriver {
  private connection: any = null;

  async healthCheck(): Promise<HealthResult> {
    const startTime = Date.now();

    try {
      this.connection = await mysql.createConnection({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.user,
        password: this.config.password,
      });

      const [rows]: any = await this.connection.query(
        "SELECT VERSION() as version"
      );
      const latencyMs = Date.now() - startTime;

      return {
        ok: true,
        version: `MySQL ${rows[0].version}`,
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
      if (!this.connection) {
        this.connection = await mysql.createConnection({
          host: this.config.host,
          port: this.config.port,
          database: this.config.database,
          user: this.config.user,
          password: this.config.password,
        });
      }

      let sqlDump = `-- MySQL Database Backup\n`;
      sqlDump += `-- Generated: ${new Date().toISOString()}\n`;
      sqlDump += `-- Database: ${this.config.database}\n\n`;
      sqlDump += `SET FOREIGN_KEY_CHECKS=0;\n\n`;

      // Get all tables
      const [tables]: any = await this.connection.query(
        `SHOW TABLES FROM \`${this.config.database}\``
      );

      const tableKey = `Tables_in_${this.config.database}`;

      for (const tableRow of tables) {
        const tableName = tableRow[tableKey];

        if (!options.dataOnly) {
          // Get table schema
          const [createTableResult]: any = await this.connection.query(
            `SHOW CREATE TABLE \`${tableName}\``
          );

          if (createTableResult.length > 0) {
            sqlDump += `\n-- Table: ${tableName}\n`;
            sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
            sqlDump += createTableResult[0]["Create Table"] + ";\n";
          }
        }

        if (!options.schemaOnly) {
          // Get table data
          const [dataRows]: any = await this.connection.query(
            `SELECT * FROM \`${tableName}\``
          );

          if (dataRows.length > 0) {
            sqlDump += `\n-- Data for table: ${tableName}\n`;

            for (const dataRow of dataRows) {
              const columns = Object.keys(dataRow);
              const values = columns.map((col) => {
                const val = dataRow[col];
                if (val === null) return "NULL";
                if (typeof val === "number") return val;
                if (typeof val === "boolean") return val ? 1 : 0;
                if (val instanceof Date) return `'${val.toISOString()}'`;
                return `'${String(val).replace(/'/g, "\\'")}'`;
              });

              sqlDump += `INSERT INTO \`${tableName}\` (\`${columns.join(
                "`, `"
              )}\`) VALUES (${values.join(", ")});\n`;
            }
          }
        }
      }

      sqlDump += `\nSET FOREIGN_KEY_CHECKS=1;\n`;

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
    return new Promise((resolve, reject) => {
      const args = [
        "-h",
        this.config.host!,
        "-P",
        this.config.port!.toString(),
        "-u",
        this.config.user!,
        `-p${this.config.password}`,
        this.config.database!,
      ];

      const env = getBinaryEnv();
      const mysqlPath = getBinaryPath("mysql");
      const proc = spawn(mysqlPath, args, { env });

      const readStream = require("fs").createReadStream(filePath);
      readStream.pipe(proc.stdin);

      let stderr = "";

      proc.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      proc.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(stderr || `mysql exited with code ${code}`));
        }
      });

      proc.on("error", (error) => {
        reject(new Error(`Failed to execute mysql: ${error.message}`));
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
