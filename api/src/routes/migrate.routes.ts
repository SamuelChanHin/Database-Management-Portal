import { Router, Request, Response } from "express";
import { createDriver } from "../drivers";
import { ConnectionConfig } from "../types/database";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { promises as fs } from "fs";

const router = Router();

// POST /api/migrate - Migrate data from source to target database
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const {
      sourceConfig,
      targetConfig,
      format = "sql",
    } = req.body as {
      sourceConfig: ConnectionConfig;
      targetConfig: ConnectionConfig;
      format?: "sql" | "custom";
    };

    if (!sourceConfig || !targetConfig) {
      throw new AppError(
        400,
        "Both sourceConfig and targetConfig are required"
      );
    }

    // Verify source and target are different
    if (
      sourceConfig.type === targetConfig.type &&
      sourceConfig.host === targetConfig.host &&
      sourceConfig.database === targetConfig.database
    ) {
      throw new AppError(400, "Source and target databases must be different");
    }

    const sourceDriver = createDriver(sourceConfig);
    const targetDriver = createDriver(targetConfig);

    let backupFilePath: string | null = null;

    try {
      // Step 1: Test source connection
      const sourceHealth = await sourceDriver.healthCheck();
      if (!sourceHealth.ok) {
        throw new AppError(
          400,
          `Source database connection failed: ${sourceHealth.error}`
        );
      }

      // Step 2: Test target connection
      const targetHealth = await targetDriver.healthCheck();
      if (!targetHealth.ok) {
        throw new AppError(
          400,
          `Target database connection failed: ${targetHealth.error}`
        );
      }

      // Step 3: Backup source database
      const backupResult = await sourceDriver.backup({ format });
      backupFilePath = backupResult.filePath;

      // Step 4: Restore to target database
      await targetDriver.restore(backupFilePath);

      res.json({
        success: true,
        message: "Migration completed successfully",
        details: {
          source: `${sourceConfig.type}://${sourceConfig.database}`,
          target: `${targetConfig.type}://${targetConfig.database}`,
          backupSize: backupResult.fileSize,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      throw error;
    } finally {
      await sourceDriver.close();
      await targetDriver.close();

      // Clean up temporary backup file
      if (backupFilePath) {
        try {
          await fs.unlink(backupFilePath);
        } catch (error) {
          console.error("Failed to delete temporary backup file:", error);
        }
      }
    }
  })
);

export default router;
