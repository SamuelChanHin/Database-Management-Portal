import { useState } from "react";
import { createDriver } from "../database";
import {
  ConnectionConfig,
  BackupOptions,
  BackupProgress,
} from "../database/types";
import { saveBackupFile } from "../utils/files";

/**
 * Hook for database backup operations
 */
export function useBackup() {
  const [progress, setProgress] = useState<BackupProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<{
    filePath: string;
    fileName: string;
  } | null>(null);

  const createBackup = async (
    connection: ConnectionConfig,
    options?: BackupOptions
  ) => {
    setIsLoading(true);
    setError(null);
    setProgress(null);
    setResult(null);

    try {
      const driver = createDriver(connection);

      const sql = await driver.dumpDatabase(options, (prog) => {
        setProgress(prog as BackupProgress);
      });

      await driver.close();

      const fileResult = await saveBackupFile(sql, connection.name);
      setResult(fileResult);

      return fileResult;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Backup failed");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  return {
    createBackup,
    progress,
    isLoading,
    error,
    result,
  };
}
