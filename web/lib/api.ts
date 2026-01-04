export interface ConnectionConfig {
  id?: string;
  name: string;
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function testConnection(
  config: ConnectionConfig
): Promise<HealthCheckResult> {
  const response = await fetch(`${API_URL}/api/connect/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Connection test failed");
  }

  const result = await response.json();
  return result.data;
}

export async function createBackup(
  config: ConnectionConfig,
  format: "sql" | "custom" = "sql"
) {
  const response = await fetch(`${API_URL}/api/backup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config, format }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Backup failed");
  }

  const result = await response.json();
  return result.data;
}

export async function downloadBackup(backupId: string) {
  const url = `${API_URL}/api/backup/${backupId}`;
  window.open(url, "_blank");
}

export async function restoreDatabase(config: ConnectionConfig, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("config", JSON.stringify(config));

  const response = await fetch(`${API_URL}/api/restore`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Restore failed");
  }

  return await response.json();
}

export async function migrateDatabase(
  sourceConfig: ConnectionConfig,
  targetConfig: ConnectionConfig,
  format: "sql" | "custom" = "sql"
) {
  const response = await fetch(`${API_URL}/api/migrate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourceConfig, targetConfig, format }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Migration failed");
  }

  return await response.json();
}

// Local storage helpers
export function saveConnections(connections: ConnectionConfig[]) {
  localStorage.setItem("db-connections", JSON.stringify(connections));
}

export function loadConnections(): ConnectionConfig[] {
  const data = localStorage.getItem("db-connections");
  return data ? JSON.parse(data) : [];
}

export function exportConnections(): string {
  const connections = loadConnections();
  return JSON.stringify(connections, null, 2);
}

export function importConnections(jsonString: string): ConnectionConfig[] {
  const connections = JSON.parse(jsonString);
  saveConnections(connections);
  return connections;
}
