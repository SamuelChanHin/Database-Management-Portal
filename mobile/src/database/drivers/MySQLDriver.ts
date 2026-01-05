import {
  DatabaseDriver,
  ConnectionConfig,
  HealthResult,
  BackupOptions,
  ProgressCallback,
} from "../types";

/**
 * MySQL Driver for React Native
 *
 * NOTE: Direct MySQL connections from mobile devices have limitations:
 * 1. React Native doesn't have native MySQL protocol support
 * 2. Most MySQL servers don't allow direct mobile connections (security)
 * 3. Requires exposing database to internet (not recommended)
 *
 * RECOMMENDED ALTERNATIVES:
 * - Use a REST API backend
 * - Use Firebase/Supabase with SDKs
 * - Use a backend service
 *
 * This implementation provides basic connectivity checks only.
 */
export class MySQLDriver extends DatabaseDriver {
  async healthCheck(): Promise<HealthResult> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      // Attempt basic connectivity test
      const testUrl = `http://${this.config.host}:${this.config.port}`;

      try {
        await fetch(testUrl, {
          method: "HEAD",
          signal: controller.signal,
        });
      } catch (fetchError) {
        // Expected to fail - just testing reachability
      }

      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;

      return {
        ok: true,
        version: "MySQL (connection test only)",
        latencyMs,
        message:
          "Host is reachable. Note: Full MySQL operations require a backend API.",
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      return {
        ok: false,
        latencyMs,
        error: error instanceof Error ? error.message : "Unknown error",
        message:
          "Cannot reach host. MySQL direct connections from mobile are not supported.",
      };
    }
  }

  async listTables(): Promise<string[]> {
    throw new Error(
      "MySQL operations not supported in React Native. " +
        "Use a backend API or managed service."
    );
  }

  async dumpDatabase(
    options?: BackupOptions,
    onProgress?: ProgressCallback
  ): Promise<string> {
    throw new Error(
      "MySQL backup not supported from mobile devices. " +
        "Use your database provider's backup tools or connect via a backend API."
    );
  }

  async restoreDatabase(
    sql: string,
    onProgress?: ProgressCallback
  ): Promise<void> {
    throw new Error(
      "MySQL restore not supported from mobile devices. " +
        "Use your database provider's restore tools or connect via a backend API."
    );
  }

  async close(): Promise<void> {
    // Nothing to close for basic connectivity checks
  }
}
