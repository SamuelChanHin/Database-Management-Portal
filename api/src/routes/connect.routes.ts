import { Router, Request, Response } from "express";
import { createDriver } from "../drivers";
import { ConnectionConfig } from "../types/database";
import { asyncHandler } from "../middleware/errorHandler";
import { AppError } from "../middleware/errorHandler";

const router = Router();

// Validate connection config
function validateConnectionConfig(
  config: any
): asserts config is ConnectionConfig {
  if (!config.type || !["postgres", "mysql", "sqlite"].includes(config.type)) {
    throw new AppError(
      400,
      "Invalid database type. Must be postgres, mysql, or sqlite"
    );
  }

  if (!config.database) {
    throw new AppError(400, "Database name is required");
  }

  if (config.type !== "sqlite") {
    if (!config.user) {
      throw new AppError(400, "User is required for postgres/mysql");
    }
    if (!config.password) {
      throw new AppError(400, "Password is required for postgres/mysql");
    }
  }
}

// POST /api/connect/test - Test database connection
router.post(
  "/test",
  asyncHandler(async (req: Request, res: Response) => {
    const config = req.body;

    validateConnectionConfig(config);

    const driver = createDriver(config);
    const result = await driver.healthCheck();

    res.json({
      success: true,
      data: result,
    });
  })
);

export default router;
