export type DbType = "postgres" | "mysql" | "sqlite";

export interface ConnectionConfig {
  id: string;
  type: DbType;
  name: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean;
  // For SQLite
  filePath?: string;
}

export interface HealthResult {
  ok: boolean;
  message?: string;
  latencyMs?: number;
  version?: string;
  error?: string;
}

export interface BackupOptions {
  schemaOnly?: boolean;
  dataOnly?: boolean;
}

export interface BackupProgress {
  currentTable?: string;
  totalTables?: number;
  processedTables?: number;
  percentage?: number;
}

export interface RestoreProgress {
  currentStatement?: number;
  totalStatements?: number;
  percentage?: number;
}

export type ProgressCallback = (
  progress: BackupProgress | RestoreProgress
) => void;

export abstract class DatabaseDriver {
  constructor(protected config: ConnectionConfig) {}

  abstract healthCheck(): Promise<HealthResult>;
  abstract listTables(): Promise<string[]>;
  abstract dumpDatabase(
    options?: BackupOptions,
    onProgress?: ProgressCallback
  ): Promise<string>;
  abstract restoreDatabase(
    sql: string,
    onProgress?: ProgressCallback
  ): Promise<void>;
  abstract close(): Promise<void>;
}
