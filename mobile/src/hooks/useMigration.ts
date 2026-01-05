import { useState } from "react";
import { createDriver } from "../database";
import { convertSql } from "../database/sqlConverter";
import {
  ConnectionConfig,
  BackupProgress,
  RestoreProgress,
} from "../database/types";

interface MigrationProgress {
  stage: "dumping" | "converting" | "restoring" | "complete";
  backupProgress?: BackupProgress;
  restoreProgress?: RestoreProgress;
}

/**
 * Hook for database migration operations
 */
export function useMigration() {
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const migrateDatabase = async (
    sourceConnection: ConnectionConfig,
    targetConnection: ConnectionConfig
  ) => {
    setIsLoading(true);
    setError(null);
    setProgress(null);

    try {
      // Stage 1: Dump source database
      setProgress({ stage: "dumping" });
      const sourceDriver = createDriver(sourceConnection);

      const sourceSql = await sourceDriver.dumpDatabase(undefined, (prog) => {
        setProgress({
          stage: "dumping",
          backupProgress: prog as BackupProgress,
        });
      });

      await sourceDriver.close();

      // Stage 2: Convert SQL dialect
      setProgress({ stage: "converting" });
      const convertedSql = convertSql(
        sourceSql,
        sourceConnection.type,
        targetConnection.type
      );

      // Stage 3: Restore to target database
      setProgress({ stage: "restoring" });
      const targetDriver = createDriver(targetConnection);

      await targetDriver.restoreDatabase(convertedSql, (prog) => {
        setProgress({
          stage: "restoring",
          restoreProgress: prog as RestoreProgress,
        });
      });

      await targetDriver.close();

      setProgress({ stage: "complete" });
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Migration failed");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    migrateDatabase,
    progress,
    isLoading,
    error,
  };
}
