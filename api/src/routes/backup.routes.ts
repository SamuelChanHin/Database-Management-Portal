import { Router, Request, Response } from "express";
import { createDriver } from "../drivers";
import { ConnectionConfig, BackupOptions } from "../types/database";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { promises as fs } from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Store backup metadata (in production, use a database)
const backupRegistry = new Map<
  string,
  { filePath: string; fileName: string; timestamp: string }
>();

// POST /api/backup - Create database backup
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { config, format = "sql" } = req.body as {
      config: ConnectionConfig;
      format: "sql" | "custom";
    };

    if (!config) {
      throw new AppError(400, "Connection config is required");
    }

    const driver = createDriver(config);

    try {
      const result = await driver.backup({ format });
      const backupId = uuidv4();

      backupRegistry.set(backupId, {
        filePath: result.filePath,
        fileName: result.fileName,
        timestamp: result.timestamp,
      });

      // Cleanup old backups (older than 24 hours)
      setTimeout(() => cleanupOldBackups(), 1000);

      res.json({
        success: true,
        data: {
          backupId,
          fileName: result.fileName,
          fileSize: result.fileSize,
          timestamp: result.timestamp,
          downloadUrl: `/api/backup/${backupId}`,
        },
      });
    } finally {
      await driver.close();
    }
  })
);

// GET /api/backup/:id - Download backup file
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const backup = backupRegistry.get(id);

    if (!backup) {
      throw new AppError(404, "Backup not found or expired");
    }

    const exists = await fs
      .access(backup.filePath)
      .then(() => true)
      .catch(() => false);
    if (!exists) {
      backupRegistry.delete(id);
      throw new AppError(404, "Backup file not found");
    }

    res.download(backup.filePath, backup.fileName);
  })
);

// Cleanup function
async function cleanupOldBackups() {
  const uploadDir = process.env.UPLOAD_DIR || "/app/data";
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  try {
    const files = await fs.readdir(uploadDir);
    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      const stats = await fs.stat(filePath);

      if (now - stats.mtimeMs > maxAge) {
        await fs.unlink(filePath);
        console.log(`Cleaned up old backup: ${file}`);
      }
    }
  } catch (error) {
    console.error("Cleanup error:", error);
  }
}

export default router;
