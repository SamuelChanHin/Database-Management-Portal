import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  loadConnections,
  saveConnection,
  deleteConnection,
} from "../utils/storage";
import { ConnectionConfig } from "../database/types";

/**
 * Hook to load all connections
 */
export function useConnections() {
  return useQuery({
    queryKey: ["connections"],
    queryFn: loadConnections,
  });
}

/**
 * Hook to save/update a connection
 */
export function useSaveConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connection: ConnectionConfig) => saveConnection(connection),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });
}

/**
 * Hook to delete a connection
 */
export function useDeleteConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (connectionId: string) => deleteConnection(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
  });
}
