import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import {
  Button,
  Card,
  Text,
  Menu,
  ProgressBar,
  Chip,
} from "react-native-paper";
import { useConnections } from "../../src/hooks/useConnections";
import { useMigration } from "../../src/hooks/useMigration";
import { ConnectionConfig } from "../../src/database/types";

export default function MigrateScreen() {
  const { data: connections = [] } = useConnections();
  const { migrateDatabase, progress, isLoading } = useMigration();

  const [sourceConnection, setSourceConnection] =
    useState<ConnectionConfig | null>(null);
  const [targetConnection, setTargetConnection] =
    useState<ConnectionConfig | null>(null);
  const [sourceMenuVisible, setSourceMenuVisible] = useState(false);
  const [targetMenuVisible, setTargetMenuVisible] = useState(false);

  const handleMigrate = async () => {
    if (!sourceConnection || !targetConnection) {
      Alert.alert("Error", "Please select both source and target connections");
      return;
    }

    if (sourceConnection.id === targetConnection.id) {
      Alert.alert("Error", "Source and target must be different databases");
      return;
    }

    Alert.alert(
      "Confirm Migration",
      `Migrate from ${sourceConnection.name} (${sourceConnection.type}) to ${targetConnection.name} (${targetConnection.type})?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Migrate",
          style: "destructive",
          onPress: async () => {
            try {
              await migrateDatabase(sourceConnection, targetConnection);
              Alert.alert("Success", "Migration completed successfully");
            } catch (error) {
              Alert.alert(
                "Migration Failed",
                error instanceof Error ? error.message : "Unknown error"
              );
            }
          },
        },
      ]
    );
  };

  const getStageText = () => {
    if (!progress) return "";
    switch (progress.stage) {
      case "dumping":
        return "Backing up source database...";
      case "converting":
        return "Converting SQL dialect...";
      case "restoring":
        return "Restoring to target database...";
      case "complete":
        return "Migration complete!";
      default:
        return "";
    }
  };

  const getProgressPercentage = () => {
    if (!progress) return 0;

    if (progress.backupProgress?.percentage) {
      return progress.backupProgress.percentage / 3; // 0-33%
    }

    if (progress.stage === "converting") {
      return 33; // 33-66%
    }

    if (progress.restoreProgress?.percentage) {
      return 66 + progress.restoreProgress.percentage / 3; // 66-100%
    }

    if (progress.stage === "complete") {
      return 100;
    }

    return 0;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Source Database
            </Text>

            <Menu
              visible={sourceMenuVisible}
              onDismiss={() => setSourceMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setSourceMenuVisible(true)}
                  icon="database"
                >
                  {sourceConnection?.name || "Choose source..."}
                </Button>
              }
            >
              {connections.map((conn) => (
                <Menu.Item
                  key={conn.id}
                  onPress={() => {
                    setSourceConnection(conn);
                    setSourceMenuVisible(false);
                  }}
                  title={`${conn.name} (${conn.type})`}
                />
              ))}
            </Menu>

            {sourceConnection && (
              <Chip icon="database" style={styles.selectedChip}>
                {sourceConnection.type.toUpperCase()}
              </Chip>
            )}

            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { marginTop: 24 }]}
            >
              Target Database
            </Text>

            <Menu
              visible={targetMenuVisible}
              onDismiss={() => setTargetMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setTargetMenuVisible(true)}
                  icon="database"
                >
                  {targetConnection?.name || "Choose target..."}
                </Button>
              }
            >
              {connections.map((conn) => (
                <Menu.Item
                  key={conn.id}
                  onPress={() => {
                    setTargetConnection(conn);
                    setTargetMenuVisible(false);
                  }}
                  title={`${conn.name} (${conn.type})`}
                  disabled={conn.id === sourceConnection?.id}
                />
              ))}
            </Menu>

            {targetConnection && (
              <Chip icon="database" style={styles.selectedChip}>
                {targetConnection.type.toUpperCase()}
              </Chip>
            )}

            {progress && (
              <View style={styles.progressContainer}>
                <Text variant="bodyMedium" style={styles.stageText}>
                  {getStageText()}
                </Text>
                <ProgressBar
                  progress={getProgressPercentage() / 100}
                  style={styles.progressBar}
                />

                {progress.backupProgress && (
                  <Text variant="bodySmall">
                    {progress.backupProgress.currentTable || "Processing..."}
                  </Text>
                )}

                {progress.restoreProgress && (
                  <Text variant="bodySmall">
                    Statement {progress.restoreProgress.currentStatement} /{" "}
                    {progress.restoreProgress.totalStatements}
                  </Text>
                )}
              </View>
            )}

            <Card style={styles.infoCard}>
              <Card.Content>
                <Text variant="bodySmall">
                  💡 Migration will:
                  {"\n"}• Export data from source database
                  {"\n"}• Convert SQL dialect if needed
                  {"\n"}• Import data to target database
                </Text>
              </Card.Content>
            </Card>

            <Button
              mode="contained"
              onPress={handleMigrate}
              loading={isLoading}
              disabled={!sourceConnection || !targetConnection || isLoading}
              icon="arrow-left-right"
              style={styles.actionButton}
            >
              Start Migration
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  selectedChip: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  progressContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  stageText: {
    marginBottom: 8,
    fontWeight: "bold",
  },
  progressBar: {
    marginVertical: 8,
  },
  infoCard: {
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: "#dbeafe",
  },
  actionButton: {
    marginTop: 8,
  },
});
