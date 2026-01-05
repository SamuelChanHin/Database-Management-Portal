import React from "react";
import { View, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { Button, Card, Text, Chip, ProgressBar } from "react-native-paper";
import { useConnections } from "../../src/hooks/useConnections";
import { useHealthCheck } from "../../src/hooks/useHealthCheck";

export default function HealthScreen() {
  const {
    data: connections = [],
    refetch,
    isLoading: loadingConnections,
  } = useConnections();
  const { checkHealth, checkAllHealth, results, isLoading } = useHealthCheck();

  const handleCheckAll = () => {
    checkAllHealth(connections);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          mode="contained"
          onPress={handleCheckAll}
          loading={isLoading}
          disabled={connections.length === 0}
          icon="play"
        >
          Check All Connections
        </Button>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={loadingConnections}
            onRefresh={() => refetch()}
          />
        }
      >
        {connections.map((conn) => {
          const health = results.get(conn.id);

          return (
            <Card key={conn.id} style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text variant="titleMedium">{conn.name}</Text>
                    <Text variant="bodySmall" style={styles.subtitle}>
                      {conn.type.toUpperCase()}
                    </Text>
                  </View>

                  {health && (
                    <View
                      style={[
                        styles.statusIndicator,
                        { backgroundColor: health.ok ? "#22c55e" : "#ef4444" },
                      ]}
                    />
                  )}
                </View>

                {health && (
                  <View style={styles.healthInfo}>
                    <Text variant="bodySmall">
                      Status: {health.ok ? "Connected" : "Failed"}
                    </Text>
                    {health.version && (
                      <Text variant="bodySmall">Version: {health.version}</Text>
                    )}
                    {health.latencyMs !== undefined && (
                      <Text variant="bodySmall">
                        Latency: {health.latencyMs}ms
                      </Text>
                    )}
                    {health.error && (
                      <Text variant="bodySmall" style={{ color: "#ef4444" }}>
                        Error: {health.error}
                      </Text>
                    )}
                  </View>
                )}

                <Button
                  mode="outlined"
                  onPress={() => checkHealth(conn)}
                  style={styles.testButton}
                  icon="play"
                >
                  Test Connection
                </Button>
              </Card.Content>
            </Card>
          );
        })}

        {connections.length === 0 && (
          <View style={styles.emptyState}>
            <Text variant="titleLarge">No connections</Text>
            <Text variant="bodyMedium" style={{ marginTop: 8 }}>
              Add connections in the Connections tab
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  subtitle: {
    color: "#666",
    marginTop: 4,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  healthInfo: {
    marginBottom: 12,
    gap: 4,
  },
  testButton: {
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    marginTop: 64,
  },
});
