import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import {
  Button,
  Card,
  Text,
  FAB,
  Dialog,
  Portal,
  TextInput,
  Chip,
  IconButton,
} from "react-native-paper";
import {
  useConnections,
  useSaveConnection,
  useDeleteConnection,
} from "../../src/hooks/useConnections";
import { ConnectionConfig, DbType } from "../../src/database/types";

export default function ConnectionsScreen() {
  const { data: connections = [], isLoading } = useConnections();
  const saveConnection = useSaveConnection();
  const deleteConnection = useDeleteConnection();

  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingConnection, setEditingConnection] =
    useState<ConnectionConfig | null>(null);

  const [formData, setFormData] = useState<Partial<ConnectionConfig>>({
    type: "sqlite",
    name: "",
    host: "",
    port: 5432,
    database: "",
    user: "",
    password: "",
    ssl: false,
  });

  const openAddDialog = () => {
    setEditingConnection(null);
    setFormData({
      type: "sqlite",
      name: "",
      host: "",
      port: 5432,
      database: "",
      user: "",
      password: "",
      ssl: false,
    });
    setDialogVisible(true);
  };

  const openEditDialog = (connection: ConnectionConfig) => {
    setEditingConnection(connection);
    setFormData(connection);
    setDialogVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.type) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (formData.type !== "sqlite" && (!formData.host || !formData.database)) {
      Alert.alert("Error", "Please fill in host and database");
      return;
    }

    if (
      formData.type === "sqlite" &&
      !formData.filePath &&
      !formData.database
    ) {
      Alert.alert("Error", "Please provide a database file path");
      return;
    }

    const connection: ConnectionConfig = {
      id: editingConnection?.id || `${Date.now()}`,
      ...(formData as ConnectionConfig),
    };

    await saveConnection.mutateAsync(connection);
    setDialogVisible(false);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Delete Connection",
      `Are you sure you want to delete "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteConnection.mutate(id),
        },
      ]
    );
  };

  const getTypeColor = (type: DbType) => {
    switch (type) {
      case "postgres":
        return "#3b82f6";
      case "mysql":
        return "#f97316";
      case "sqlite":
        return "#22c55e";
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {connections.map((conn) => (
          <Card key={conn.id} style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <View>
                  <Text variant="titleMedium">{conn.name}</Text>
                  <Chip
                    mode="outlined"
                    style={{
                      marginTop: 8,
                      backgroundColor: getTypeColor(conn.type) + "20",
                    }}
                  >
                    {conn.type.toUpperCase()}
                  </Chip>
                </View>
                <View style={styles.cardActions}>
                  <IconButton
                    icon="pencil"
                    size={20}
                    onPress={() => openEditDialog(conn)}
                  />
                  <IconButton
                    icon="delete"
                    size={20}
                    iconColor="#ef4444"
                    onPress={() => handleDelete(conn.id, conn.name)}
                  />
                </View>
              </View>

              <View style={styles.details}>
                {conn.type !== "sqlite" && (
                  <>
                    <Text variant="bodySmall">Host: {conn.host}</Text>
                    <Text variant="bodySmall">Database: {conn.database}</Text>
                    <Text variant="bodySmall">User: {conn.user}</Text>
                  </>
                )}
                {conn.type === "sqlite" && (
                  <Text variant="bodySmall">
                    File: {conn.filePath || conn.database}
                  </Text>
                )}
              </View>
            </Card.Content>
          </Card>
        ))}

        {connections.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <Text variant="titleLarge">No connections yet</Text>
            <Text
              variant="bodyMedium"
              style={{ marginTop: 8, textAlign: "center" }}
            >
              Add your first database connection to get started
            </Text>
          </View>
        )}
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={openAddDialog}
        label="Add Connection"
      />

      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
        >
          <Dialog.Title>
            {editingConnection ? "Edit Connection" : "Add Connection"}
          </Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <TextInput
                label="Connection Name *"
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
                style={styles.input}
              />

              <View style={styles.typeSelector}>
                <Chip
                  selected={formData.type === "sqlite"}
                  onPress={() => setFormData({ ...formData, type: "sqlite" })}
                  style={styles.typeChip}
                >
                  SQLite
                </Chip>
                <Chip
                  selected={formData.type === "postgres"}
                  onPress={() => setFormData({ ...formData, type: "postgres" })}
                  style={styles.typeChip}
                >
                  PostgreSQL
                </Chip>
                <Chip
                  selected={formData.type === "mysql"}
                  onPress={() => setFormData({ ...formData, type: "mysql" })}
                  style={styles.typeChip}
                >
                  MySQL
                </Chip>
              </View>

              {formData.type === "sqlite" ? (
                <TextInput
                  label="Database File Path *"
                  value={formData.filePath || formData.database}
                  onChangeText={(text) =>
                    setFormData({ ...formData, filePath: text, database: text })
                  }
                  style={styles.input}
                  placeholder="/path/to/database.db"
                />
              ) : (
                <>
                  <TextInput
                    label="Host *"
                    value={formData.host}
                    onChangeText={(text) =>
                      setFormData({ ...formData, host: text })
                    }
                    style={styles.input}
                  />
                  <TextInput
                    label="Port"
                    value={formData.port?.toString()}
                    onChangeText={(text) =>
                      setFormData({ ...formData, port: parseInt(text) || 5432 })
                    }
                    keyboardType="numeric"
                    style={styles.input}
                  />
                  <TextInput
                    label="Database *"
                    value={formData.database}
                    onChangeText={(text) =>
                      setFormData({ ...formData, database: text })
                    }
                    style={styles.input}
                  />
                  <TextInput
                    label="Username"
                    value={formData.user}
                    onChangeText={(text) =>
                      setFormData({ ...formData, user: text })
                    }
                    style={styles.input}
                  />
                  <TextInput
                    label="Password"
                    value={formData.password}
                    onChangeText={(text) =>
                      setFormData({ ...formData, password: text })
                    }
                    secureTextEntry
                    style={styles.input}
                  />
                </>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleSave} loading={saveConnection.isPending}>
              {editingConnection ? "Update" : "Add"}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardActions: {
    flexDirection: "row",
  },
  details: {
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    marginTop: 64,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  input: {
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    flex: 1,
  },
});
