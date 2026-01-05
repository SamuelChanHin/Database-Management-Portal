export type DbType = "postgres" | "mysql" | "sqlite";

export interface ConnectionConfig {
  id?: string;
  name: string;
  type: DbType;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  filePath?: string; // For SQLite
  ssl?: boolean;
}

export interface HealthResult {
  ok: boolean;
  version?: string;
  latencyMs?: number;
  message?: string;
  error?: string;
}

export interface BackupOptions {
  schemaOnly?: boolean;
  dataOnly?: boolean;
  compress?: boolean;
}

export interface BackupResult {
  success: boolean;
  filePath?: string;
  sizeBytes?: number;
  tablesCount?: number;
  error?: string;
}

export interface ProgressCallback {
  (progress: {
    currentTable?: string;
    processedTables?: number;
    totalTables?: number;
    percentage?: number;
  }): void;
}

export abstract class DatabaseDriver {
  constructor(protected config: ConnectionConfig) {}

  abstract healthCheck(): Promise<HealthResult>;
  abstract backup(
    options: BackupOptions,
    outputPath: string
  ): Promise<BackupResult>;
  abstract restore(filePath: string): Promise<void>;
  abstract close(): Promise<void>;
}
