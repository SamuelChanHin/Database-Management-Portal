import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { Button, Card, Text, Menu, ProgressBar } from "react-native-paper";
import { useConnections } from "../../src/hooks/useConnections";
import { useRestore } from "../../src/hooks/useRestore";
import { pickSqlFile } from "../../src/utils/files";
import { ConnectionConfig } from "../../src/database/types";

export default function RestoreScreen() {
  const { data: connections = [] } = useConnections();
  const { restoreDatabase, progress, isLoading } = useRestore();

  const [selectedConnection, setSelectedConnection] =
    useState<ConnectionConfig | null>(null);
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
  } | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const handlePickFile = async () => {
    const file = await pickSqlFile();
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleRestore = async () => {
    if (!selectedConnection) {
      Alert.alert("Error", "Please select a connection");
      return;
    }

    if (!selectedFile) {
      Alert.alert("Error", "Please select a backup file");
      return;
    }

    Alert.alert(
      "Confirm Restore",
      `This will restore data to ${selectedConnection.name}. This operation may overwrite existing data. Continue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          style: "destructive",
          onPress: async () => {
            try {
              await restoreDatabase(selectedConnection, selectedFile.uri);
              Alert.alert("Success", "Database restored successfully");
              setSelectedFile(null);
            } catch (error) {
              Alert.alert(
                "Restore Failed",
                error instanceof Error ? error.message : "Unknown error"
              );
            }
          },
        },
      ]
    );
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

            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { marginTop: 24 }]}
            >
              Select Backup File
            </Text>

            <Button
              mode="outlined"
              onPress={handlePickFile}
              icon="file"
              style={styles.fileButton}
            >
              {selectedFile?.name || "Choose file..."}
            </Button>

            {progress && (
              <View style={styles.progressContainer}>
                <Text variant="bodySmall">Restoring database...</Text>
                <ProgressBar
                  progress={(progress.percentage || 0) / 100}
                  style={styles.progressBar}
                />
                <Text variant="bodySmall">
                  Statement {progress.currentStatement || 0} /{" "}
                  {progress.totalStatements || 0}
                </Text>
              </View>
            )}

            <Card style={styles.warningCard}>
              <Card.Content>
                <Text variant="bodySmall" style={styles.warningText}>
                  ⚠️ Warning: Restore will execute SQL statements from the file.
                  This may modify or delete existing data. Make sure you trust
                  the backup source.
                </Text>
              </Card.Content>
            </Card>

            <Button
              mode="contained"
              onPress={handleRestore}
              loading={isLoading}
              disabled={!selectedConnection || !selectedFile || isLoading}
              icon="upload"
              style={styles.actionButton}
              buttonColor="#ef4444"
            >
              Restore Database
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
  fileButton: {
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  progressBar: {
    marginVertical: 8,
  },
  warningCard: {
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: "#fef3c7",
  },
  warningText: {
    color: "#92400e",
  },
  actionButton: {
    marginTop: 8,
  },
});
