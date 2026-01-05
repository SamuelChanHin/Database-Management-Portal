import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { ArrowRight, Database } from "lucide-react";
import { DatabaseConnection } from "./ConnectionsTab";

export default function MigrateTab() {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("db-connections");
    if (saved) {
      setConnections(JSON.parse(saved));
    }
  }, []);

  const handleMigrate = async () => {
    if (!sourceId || !targetId) {
      alert("Please select both source and target databases");
      return;
    }

    if (sourceId === targetId) {
      alert("Source and target databases must be different");
      return;
    }

    if (
      !confirm("Are you sure? This will overwrite data in the target database!")
    ) {
      return;
    }

    const source = connections.find((c) => c.id === sourceId);
    const target = connections.find((c) => c.id === targetId);

    if (!source || !target) {
      alert("Invalid source or target database");
      return;
    }

    setMigrating(true);
    try {
      // Map username -> user for backend compatibility
      const sourceConfig = {
        ...source,
        user: source.username,
        ssl: source.ssl,
      };
      const targetConfig = {
        ...target,
        user: target.username,
        ssl: target.ssl,
      };
      const result = await window.electronAPI.migrateDatabase(
        sourceConfig,
        targetConfig
      );
      if (result.success) {
        alert("Migration completed successfully!");
      } else {
        alert(`Migration failed: ${result.error || result.message}`);
      }
    } catch (error) {
      alert(`Migration failed: ${error}`);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Migrate Database</h2>
        <p className="text-slate-500">
          Migrate data from one database to another. This creates a backup of
          the source and restores it to the target.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Migration Settings</CardTitle>
          <CardDescription>
            Select source and target databases for migration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-[1fr,auto,1fr] gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="source">Source Database</Label>
              <select
                id="source"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
              >
                <option value="">Select source...</option>
                {connections.map((conn) => (
                  <option key={conn.id} value={conn.id}>
                    {conn.name} ({conn.type})
                  </option>
                ))}
              </select>
              {sourceId && (
                <div className="text-sm text-slate-500">
                  {connections.find((c) => c.id === sourceId)?.type === "sqlite"
                    ? connections.find((c) => c.id === sourceId)?.filePath
                    : `${connections.find((c) => c.id === sourceId)?.host}:${
                        connections.find((c) => c.id === sourceId)?.port
                      }/${
                        connections.find((c) => c.id === sourceId)?.database
                      }`}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center pb-2">
              <ArrowRight className="w-6 h-6 text-slate-400" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target">Target Database</Label>
              <select
                id="target"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
              >
                <option value="">Select target...</option>
                {connections.map((conn) => (
                  <option key={conn.id} value={conn.id}>
                    {conn.name} ({conn.type})
                  </option>
                ))}
              </select>
              {targetId && (
                <div className="text-sm text-slate-500">
                  {connections.find((c) => c.id === targetId)?.type === "sqlite"
                    ? connections.find((c) => c.id === targetId)?.filePath
                    : `${connections.find((c) => c.id === targetId)?.host}:${
                        connections.find((c) => c.id === targetId)?.port
                      }/${
                        connections.find((c) => c.id === targetId)?.database
                      }`}
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={handleMigrate}
            disabled={
              !sourceId || !targetId || sourceId === targetId || migrating
            }
            className="w-full"
            variant="destructive"
          >
            {migrating ? "Migrating..." : "Start Migration"}
          </Button>

          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <h4 className="font-medium text-yellow-900 mb-2">⚠️ Warning</h4>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>This will overwrite all data in the target database</li>
              <li>Ensure you have backups before proceeding</li>
              <li>The target database will be cleared before migration</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {connections.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500">
              No database connections configured. Add connections in the
              Connections tab first.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
