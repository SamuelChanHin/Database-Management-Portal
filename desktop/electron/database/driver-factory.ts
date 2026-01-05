import { ConnectionConfig, DatabaseDriver } from "./types";
import { PostgresDriver } from "./postgres-driver";
import { MySQLDriver } from "./mysql-driver";
import { SQLiteDriver } from "./sqlite-driver";

export class DatabaseDriverFactory {
  static create(config: ConnectionConfig): DatabaseDriver {
    switch (config.type) {
      case "postgres":
        return new PostgresDriver(config);
      case "mysql":
        return new MySQLDriver(config);
      case "sqlite":
        return new SQLiteDriver(config);
      default:
        throw new Error(`Unsupported database type: ${config.type}`);
    }
  }
}
