import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Database, Plus, Trash2, TestTube } from "lucide-react";

export interface DatabaseConnection {
  id: string;
  name: string;
  type: "postgres" | "mysql" | "sqlite";
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  filePath?: string;
  ssl?: boolean;
}

export default function ConnectionsTab() {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testingAll, setTestingAll] = useState(false);
  const [healthStatus, setHealthStatus] = useState<
    Record<string, { ok: boolean; version?: string }>
  >({});
  const [formData, setFormData] = useState<Partial<DatabaseConnection>>({
    type: "postgres",
  });

  useEffect(() => {
    const saved = localStorage.getItem("db-connections");
    if (saved) {
      setConnections(JSON.parse(saved));
    }
  }, []);

  const saveConnections = (conns: DatabaseConnection[]) => {
    localStorage.setItem("db-connections", JSON.stringify(conns));
    setConnections(conns);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newConnection: DatabaseConnection = {
      id: editingId || Date.now().toString(),
      name: formData.name || "",
      type: formData.type || "postgres",
      host: formData.host,
      port: formData.port,
      database: formData.database || "",
      username: formData.username,
      password: formData.password,
      filePath: formData.filePath,
    };

    if (editingId) {
      saveConnections(
        connections.map((c) => (c.id === editingId ? newConnection : c))
      );
    } else {
      saveConnections([...connections, newConnection]);
    }

    setFormData({ type: "postgres" });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (connection: DatabaseConnection) => {
    setFormData(connection);
    setEditingId(connection.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this connection?")) {
      saveConnections(connections.filter((c) => c.id !== id));
    }
  };

  const handleTest = async (connection: DatabaseConnection) => {
    setTestingId(connection.id);
    try {
      // Map username -> user for backend compatibility
      const configForBackend = {
        ...connection,
        user: connection.username,
        ssl: connection.ssl,
      };
      const result = await window.electronAPI.testConnection(configForBackend);

      // Update health status
      setHealthStatus((prev) => ({
        ...prev,
        [connection.id]: { ok: result.ok, version: result.version },
      }));

      alert(
        result.ok
          ? "Connection successful!"
          : `Connection failed: ${result.error || result.message}`
      );
    } catch (error) {
      setHealthStatus((prev) => ({
        ...prev,
        [connection.id]: { ok: false },
      }));
      alert(`Connection failed: ${error}`);
    } finally {
      setTestingId(null);
    }
  };

  const handleFileSelect = async () => {
    try {
      const result = await window.electronAPI.selectFile();
      if (result) {
        setFormData({ ...formData, filePath: result });
      }
    } catch (error) {
      console.error("File selection error:", error);
    }
  };

  const handleTestAll = async () => {
    if (connections.length === 0) {
      alert("No connections to test");
      return;
    }

    setTestingAll(true);
    const results: Record<string, { ok: boolean; version?: string }> = {};

    for (const connection of connections) {
      try {
        const configForBackend = {
          ...connection,
          user: connection.username,
          ssl: connection.ssl,
        };
        const result = await window.electronAPI.testConnection(
          configForBackend
        );
        results[connection.id] = { ok: result.ok, version: result.version };
      } catch (error) {
        results[connection.id] = { ok: false };
      }
    }

    setHealthStatus(results);
    setTestingAll(false);

    const successCount = Object.values(results).filter((r) => r.ok).length;
    alert(
      `Testing complete: ${successCount}/${connections.length} connections successful`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Database Connections</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleTestAll}
            disabled={testingAll || connections.length === 0}
          >
            <TestTube className="w-4 h-4 mr-2" />
            {testingAll ? "Testing All..." : "Test All"}
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Connection
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit" : "New"} Connection</CardTitle>
            <CardDescription>
              Configure your database connection settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Connection Name</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Database Type</Label>
                <select
                  id="type"
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as DatabaseConnection["type"],
                    })
                  }
                >
                  <option value="postgres">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                  <option value="sqlite">SQLite</option>
                </select>
              </div>

              {formData.type === "sqlite" ? (
                <div>
                  <Label htmlFor="filePath">Database File</Label>
                  <div className="flex gap-2">
                    <Input
                      id="filePath"
                      value={formData.filePath || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, filePath: e.target.value })
                      }
                      placeholder="/path/to/database.db"
                      required
                    />
                    <Button type="button" onClick={handleFileSelect}>
                      Browse
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="host">Host</Label>
                      <Input
                        id="host"
                        value={formData.host || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, host: e.target.value })
                        }
                        placeholder="localhost"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="port">Port</Label>
                      <Input
                        id="port"
                        type="number"
                        value={formData.port || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            port: parseInt(e.target.value),
                          })
                        }
                        placeholder={
                          formData.type === "postgres" ? "5432" : "3306"
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="database">Database</Label>
                    <Input
                      id="database"
                      value={formData.database || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, database: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={formData.username || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            username: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            password: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? "Update" : "Save"} Connection
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ type: "postgres" });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {connections.map((connection) => (
          <Card key={connection.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  <CardTitle className="text-lg">{connection.name}</CardTitle>
                  {healthStatus[connection.id] && (
                    <div
                      className={`w-2 h-2 rounded-full ${
                        healthStatus[connection.id].ok
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                      title={
                        healthStatus[connection.id].ok ? "Connected" : "Failed"
                      }
                    />
                  )}
                </div>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                  {connection.type}
                </span>
              </div>
              <CardDescription>
                {connection.type === "sqlite"
                  ? connection.filePath
                  : `${connection.host}:${connection.port}/${connection.database}`}
                {healthStatus[connection.id]?.version && (
                  <div className="text-xs text-slate-400 mt-1">
                    {healthStatus[connection.id].version}
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTest(connection)}
                  disabled={testingId === connection.id}
                >
                  <TestTube className="w-4 h-4 mr-1" />
                  {testingId === connection.id ? "Testing..." : "Test"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(connection)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(connection.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {connections.length === 0 && !showForm && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500 mb-4">
              No database connections configured
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Connection
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
