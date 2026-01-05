import { useState } from "react";
import { createDriver } from "../database";
import { ConnectionConfig, RestoreProgress } from "../database/types";
import { readSqlFile } from "../utils/files";

/**
 * Hook for database restore operations
 */
export function useRestore() {
  const [progress, setProgress] = useState<RestoreProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const restoreDatabase = async (
    connection: ConnectionConfig,
    fileUri: string
  ) => {
    setIsLoading(true);
    setError(null);
    setProgress(null);

    try {
      const sql = await readSqlFile(fileUri);
      const driver = createDriver(connection);

      await driver.restoreDatabase(sql, (prog) => {
        setProgress(prog as RestoreProgress);
      });

      await driver.close();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Restore failed");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  return {
    restoreDatabase,
    progress,
    isLoading,
    error,
  };
}
