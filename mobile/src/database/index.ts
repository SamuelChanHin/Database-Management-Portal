import { ConnectionConfig, DatabaseDriver } from "./types";
import { SQLiteDriver } from "./drivers/SQLiteDriver";
import { PostgresDriver } from "./drivers/PostgresDriver";
import { MySQLDriver } from "./drivers/MySQLDriver";

export function createDriver(config: ConnectionConfig): DatabaseDriver {
  switch (config.type) {
    case "sqlite":
      return new SQLiteDriver(config);
    case "postgres":
      return new PostgresDriver(config);
    case "mysql":
      return new MySQLDriver(config);
    default:
      throw new Error(`Unsupported database type: ${(config as any).type}`);
  }
}

export * from "./types";
export * from "./drivers/SQLiteDriver";
export * from "./drivers/PostgresDriver";
export * from "./drivers/MySQLDriver";
export * from "./sqlConverter";
