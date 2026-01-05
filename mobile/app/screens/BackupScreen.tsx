import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { Button, Card, Text, Menu, ProgressBar } from "react-native-paper";
import { useConnections } from "../../src/hooks/useConnections";
import { useBackup } from "../../src/hooks/useBackup";
import { shareFile } from "../../src/utils/files";
import { ConnectionConfig } from "../../src/database/types";

export default function BackupScreen() {
  const { data: connections = [] } = useConnections();
  const { createBackup, progress, isLoading, result } = useBackup();

  const [selectedConnection, setSelectedConnection] =
    useState<ConnectionConfig | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [schemaOnly, setSchemaOnly] = useState(false);

  const handleBackup = async () => {
    if (!selectedConnection) {
      Alert.alert("Error", "Please select a connection");
      return;
    }

    try {
      const result = await createBackup(selectedConnection, {
        schemaOnly,
        dataOnly: false,
      });

      Alert.alert("Backup Complete", `Backup saved to ${result.fileName}`, [
        {
          text: "Share",
          onPress: () => shareFile(result.filePath),
        },
        { text: "OK" },
      ]);
    } catch (error) {
      Alert.alert(
        "Backup Failed",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Select Connection
            </Text>

            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setMenuVisible(true)}
                  icon="database"
                >
                  {selectedConnection?.name || "Choose connection..."}
                </Button>
              }
            >
              {connections.map((conn) => (
                <Menu.Item
                  key={conn.id}
                  onPress={() => {
                    setSelectedConnection(conn);
                    setMenuVisible(false);
                  }}
                  title={`${conn.name} (${conn.type})`}
                />
              ))}
            </Menu>

            <View style={styles.optionsContainer}>
              <Button
                mode={schemaOnly ? "contained" : "outlined"}
                onPress={() => setSchemaOnly(!schemaOnly)}
                style={styles.optionButton}
              >
                Schema Only
              </Button>
            </View>

            {progress && (
              <View style={styles.progressContainer}>
                <Text variant="bodySmall">
                  Processing: {progress.currentTable || "Preparing..."}
                </Text>
                <ProgressBar
                  progress={(progress.percentage || 0) / 100}
                  style={styles.progressBar}
                />
                <Text variant="bodySmall">
                  {progress.processedTables || 0} / {progress.totalTables || 0}{" "}
                  tables
                </Text>
              </View>
            )}

            <Button
              mode="contained"
              onPress={handleBackup}
              loading={isLoading}
              disabled={!selectedConnection || isLoading}
              icon="download"
              style={styles.actionButton}
            >
              Create Backup
            </Button>

            {result && (
              <Card style={styles.resultCard}>
                <Card.Content>
                  <Text variant="titleSmall">✓ Backup Created</Text>
                  <Text variant="bodySmall" style={styles.resultText}>
                    File: {result.fileName}
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={() => shareFile(result.filePath)}
                    icon="share"
                    style={styles.shareButton}
                  >
                    Share Backup
                  </Button>
                </Card.Content>
              </Card>
            )}
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
  optionsContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  optionButton: {
    marginBottom: 8,
  },
  progressContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  progressBar: {
    marginVertical: 8,
  },
  actionButton: {
    marginTop: 16,
  },
  resultCard: {
    marginTop: 16,
    backgroundColor: "#dcfce7",
  },
  resultText: {
    marginTop: 8,
    marginBottom: 12,
  },
  shareButton: {
    marginTop: 8,
  },
});
