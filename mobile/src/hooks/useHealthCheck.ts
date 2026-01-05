import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createDriver } from "../database";
import { ConnectionConfig, HealthResult } from "../database/types";

/**
 * Hook to test database connection health
 */
export function useHealthCheck() {
  const [results, setResults] = useState<Map<string, HealthResult>>(new Map());

  const mutation = useMutation({
    mutationFn: async (connection: ConnectionConfig) => {
      const driver = createDriver(connection);
      const result = await driver.healthCheck();
      await driver.close();
      return { connectionId: connection.id, result };
    },
    onSuccess: ({ connectionId, result }) => {
      setResults((prev) => new Map(prev).set(connectionId, result));
    },
  });

  const checkHealth = (connection: ConnectionConfig) => {
    mutation.mutate(connection);
  };

  const checkAllHealth = async (connections: ConnectionConfig[]) => {
    for (const conn of connections) {
      mutation.mutate(conn);
    }
  };

  return {
    checkHealth,
    checkAllHealth,
    results,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
