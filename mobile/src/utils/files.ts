import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";

const BACKUP_DIR = `${FileSystem.documentDirectory}backups/`;

/**
 * Ensure backup directory exists
 */
async function ensureBackupDir(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(BACKUP_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
  }
}

/**
 * Save SQL backup to file
 */
export async function saveBackupFile(
  sql: string,
  dbName: string
): Promise<{ filePath: string; fileName: string }> {
  await ensureBackupDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `${dbName}_${timestamp}.sql`;
  const filePath = `${BACKUP_DIR}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, sql);

  return { filePath, fileName };
}

/**
 * Read SQL file
 */
export async function readSqlFile(uri: string): Promise<string> {
  return await FileSystem.readAsStringAsync(uri);
}

/**
 * Pick SQL file from device
 */
export async function pickSqlFile(): Promise<{
  uri: string;
  name: string;
} | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["text/plain", "application/sql", "*/*"],
    copyToCacheDirectory: true,
  });

  if (result.canceled) {
    return null;
  }

  return {
    uri: result.assets[0].uri,
    name: result.assets[0].name,
  };
}

/**
 * Share backup file
 */
export async function shareFile(filePath: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();

  if (!isAvailable) {
    throw new Error("Sharing is not available on this device");
  }

  await Sharing.shareAsync(filePath);
}

/**
 * List all backup files
 */
export async function listBackupFiles(): Promise<
  Array<{ name: string; uri: string; size: number; modifiedTime: number }>
> {
  await ensureBackupDir();

  const files = await FileSystem.readDirectoryAsync(BACKUP_DIR);

  const fileInfos = await Promise.all(
    files.map(async (name) => {
      const uri = `${BACKUP_DIR}${name}`;
      const info = await FileSystem.getInfoAsync(uri);

      return {
        name,
        uri,
        size: (info as any).size || 0,
        modifiedTime: (info as any).modificationTime || 0,
      };
    })
  );

  return fileInfos.sort((a, b) => b.modifiedTime - a.modifiedTime);
}

/**
 * Delete backup file
 */
export async function deleteBackupFile(uri: string): Promise<void> {
  await FileSystem.deleteAsync(uri);
}
