import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ConnectionConfig } from "../database/types";

const CONNECTIONS_KEY = "db_connections";
const PASSWORD_PREFIX = "db_password_";

/**
 * Save connection metadata (non-sensitive)
 */
async function saveConnectionMetadata(
  connections: ConnectionConfig[]
): Promise<void> {
  const metadata = connections.map(({ password, ...rest }) => rest);
  await AsyncStorage.setItem(CONNECTIONS_KEY, JSON.stringify(metadata));
}

/**
 * Load connection metadata (non-sensitive)
 */
async function loadConnectionMetadata(): Promise<
  Omit<ConnectionConfig, "password">[]
> {
  const data = await AsyncStorage.getItem(CONNECTIONS_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Save password securely
 */
async function savePassword(
  connectionId: string,
  password: string
): Promise<void> {
  await SecureStore.setItemAsync(`${PASSWORD_PREFIX}${connectionId}`, password);
}

/**
 * Load password securely
 */
async function loadPassword(connectionId: string): Promise<string | null> {
  return await SecureStore.getItemAsync(`${PASSWORD_PREFIX}${connectionId}`);
}

/**
 * Delete password
 */
async function deletePassword(connectionId: string): Promise<void> {
  await SecureStore.deleteItemAsync(`${PASSWORD_PREFIX}${connectionId}`);
}

/**
 * Save complete connection (metadata + password)
 */
export async function saveConnection(
  connection: ConnectionConfig
): Promise<void> {
  const metadata = await loadConnectionMetadata();

  // Check if connection exists
  const existingIndex = metadata.findIndex((c) => c.id === connection.id);

  if (existingIndex >= 0) {
    // Update existing
    metadata[existingIndex] = { ...connection, password: undefined };
  } else {
    // Add new
    const { password, ...rest } = connection;
    metadata.push(rest as any);
  }

  await saveConnectionMetadata(metadata as ConnectionConfig[]);

  // Save password if provided
  if (connection.password) {
    await savePassword(connection.id, connection.password);
  }
}

/**
 * Load all connections (with passwords)
 */
export async function loadConnections(): Promise<ConnectionConfig[]> {
  const metadata = await loadConnectionMetadata();

  const connections = await Promise.all(
    metadata.map(async (conn) => {
      const password = await loadPassword(conn.id);
      return {
        ...conn,
        password: password || undefined,
      } as ConnectionConfig;
    })
  );

  return connections;
}

/**
 * Delete a connection
 */
export async function deleteConnection(connectionId: string): Promise<void> {
  const metadata = await loadConnectionMetadata();
  const filtered = metadata.filter((c) => c.id !== connectionId);

  await saveConnectionMetadata(filtered as ConnectionConfig[]);
  await deletePassword(connectionId);
}

/**
 * Export connections (passwords replaced with placeholder)
 */
export async function exportConnections(): Promise<string> {
  const metadata = await loadConnectionMetadata();
  const exported = metadata.map((conn) => ({
    ...conn,
    password: "***REMOVED***",
  }));

  return JSON.stringify(exported, null, 2);
}

/**
 * Import connections (user must re-enter passwords)
 */
export async function importConnections(jsonString: string): Promise<void> {
  const imported = JSON.parse(jsonString);

  if (!Array.isArray(imported)) {
    throw new Error("Invalid import format");
  }

  // Generate new IDs to avoid conflicts
  const connections = imported.map((conn) => ({
    ...conn,
    id: `${Date.now()}_${Math.random()}`,
    password: undefined, // Don't import passwords
  }));

  const existing = await loadConnectionMetadata();
  const combined = [...existing, ...connections];

  await saveConnectionMetadata(combined as ConnectionConfig[]);
}
