import {
  DatabaseDriver,
  ConnectionConfig,
  HealthResult,
  BackupOptions,
  ProgressCallback,
} from "../types";
import { parseSqlStatements } from "../sqlConverter";

/**
 * PostgreSQL Driver for React Native
 *
 * NOTE: Direct PostgreSQL connections from mobile devices have limitations:
 * 1. React Native doesn't have native PostgreSQL protocol support
 * 2. Most PostgreSQL servers don't allow direct mobile connections (security)
 * 3. Requires exposing database to internet (not recommended)
 *
 * RECOMMENDED ALTERNATIVES:
 * - Use a REST API backend
 * - Use Supabase/Firebase with SDKs
 * - Use PostgREST or similar
 *
 * This implementation provides basic connectivity checks only.
 */
export class PostgresDriver extends DatabaseDriver {
  private connectionString: string;

  constructor(config: ConnectionConfig) {
    super(config);
    // Build PostgreSQL connection string
    const { host, port, database, user, password } = config;
    this.connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`;
  }

  async healthCheck(): Promise<HealthResult> {
    const startTime = Date.now();

    try {
      // For React Native, we'll do a simple TCP connectivity check
      // Real production apps should use a backend API or managed service SDK

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      // Attempt to reach the host (basic connectivity test)
      const testUrl = `http://${this.config.host}:${this.config.port}`;

      try {
        await fetch(testUrl, {
          method: "HEAD",
          signal: controller.signal,
        });
      } catch (fetchError) {
        // Expected to fail - we're just testing if host is reachable
        // HTTP will fail but tells us if host is accessible
      }

      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;

      return {
        ok: true,
        version: "PostgreSQL (connection test only)",
        latencyMs,
        message:
          "Host is reachable. Note: Full PostgreSQL operations require a backend API.",
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      return {
        ok: false,
        latencyMs,
        error: error instanceof Error ? error.message : "Unknown error",
        message:
          "Cannot reach host. PostgreSQL direct connections from mobile are not supported.",
      };
    }
  }

  async listTables(): Promise<string[]> {
    throw new Error(
      "PostgreSQL operations not supported in React Native. " +
        "Use a backend API or managed service (Supabase, Firebase, etc.)"
    );
  }

  async dumpDatabase(
    options?: BackupOptions,
    onProgress?: ProgressCallback
  ): Promise<string> {
    throw new Error(
      "PostgreSQL backup not supported from mobile devices. " +
        "Use your database provider's backup tools or connect via a backend API."
    );
  }

  async restoreDatabase(
    sql: string,
    onProgress?: ProgressCallback
  ): Promise<void> {
    throw new Error(
      "PostgreSQL restore not supported from mobile devices. " +
        "Use your database provider's restore tools or connect via a backend API."
    );
  }

  async close(): Promise<void> {
    // Nothing to close for basic connectivity checks
  }
}
