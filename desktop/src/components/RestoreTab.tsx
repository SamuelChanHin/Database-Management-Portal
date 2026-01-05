import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Database, Upload } from "lucide-react";
import { DatabaseConnection } from "./ConnectionsTab";

export default function RestoreTab() {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("db-connections");
    if (saved) {
      setConnections(JSON.parse(saved));
    }
  }, []);

  const handleRestore = async (connection: DatabaseConnection) => {
    if (!confirm("Are you sure? This will overwrite the existing database!")) {
      return;
    }

    setRestoring(connection.id);
    try {
      // Map username -> user for backend compatibility
      const configForBackend = {
        ...connection,
        user: connection.username,
        ssl: connection.ssl,
      };
      const result = await window.electronAPI.restoreDatabase(configForBackend);
      if (result.success) {
        alert("Database restored successfully!");
      } else {
        alert(`Restore failed: ${result.error || result.message}`);
      }
    } catch (error) {
      alert(`Restore failed: ${error}`);
    } finally {
      setRestoring(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Restore Database</h2>
        <p className="text-slate-500">
          Restore databases from backup files. Warning: This will overwrite
          existing data!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {connections.map((connection) => (
          <Card key={connection.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                <CardTitle className="text-lg">{connection.name}</CardTitle>
              </div>
              <CardDescription>
                {connection.type === "sqlite"
                  ? connection.filePath
                  : `${connection.host}:${connection.port}/${connection.database}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => handleRestore(connection)}
                disabled={restoring === connection.id}
                variant="destructive"
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {restoring === connection.id
                  ? "Restoring..."
                  : "Restore from Backup"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {connections.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500">
              No database connections configured. Add a connection in the
              Connections tab first.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
