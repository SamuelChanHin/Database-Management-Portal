import { Router, Request, Response } from "express";
import multer from "multer";
import { createDriver } from "../drivers";
import { ConnectionConfig } from "../types/database";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import * as path from "path";

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || "/app/data";
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `restore_${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExts = [".sql", ".dump", ".backup"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only .sql, .dump, and .backup files are allowed"
        )
      );
    }
  },
});

// POST /api/restore - Restore database from backup
router.post(
  "/",
  upload.single("file"),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError(400, "Backup file is required");
    }

    const config = JSON.parse(req.body.config) as ConnectionConfig;

    if (!config) {
      throw new AppError(400, "Connection config is required");
    }

    const driver = createDriver(config);

    try {
      await driver.restore(req.file.path);

      res.json({
        success: true,
        message: "Database restored successfully",
        fileName: req.file.originalname,
      });
    } finally {
      await driver.close();

      // Clean up uploaded file
      const fs = require("fs").promises;
      try {
        await fs.unlink(req.file.path);
      } catch (error) {
        console.error("Failed to delete uploaded file:", error);
      }
    }
  })
);

export default router;
