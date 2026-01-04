export interface ConnectionConfig {
  type: "postgres" | "mysql" | "sqlite";
  host?: string;
  port?: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}

export interface HealthCheckResult {
  ok: boolean;
  version?: string;
  latency: number;
  error?: string;
}

export interface BackupOptions {
  format: "sql" | "custom";
}

export interface BackupResult {
  filePath: string;
  fileName: string;
  fileSize?: number;
  timestamp: string;
}

export abstract class DatabaseDriver {
  constructor(protected config: ConnectionConfig) {}

  abstract healthCheck(): Promise<HealthCheckResult>;
  abstract backup(options: BackupOptions): Promise<BackupResult>;
  abstract restore(filePath: string): Promise<void>;
  abstract close(): Promise<void>;
}
