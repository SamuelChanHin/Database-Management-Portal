"use client";

import { useState, useEffect } from "react";
import { ConnectionForm } from "@/components/ConnectionForm";
import { ConnectionCard } from "@/components/ConnectionCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ConnectionConfig,
  loadConnections,
  saveConnections,
  createBackup,
  downloadBackup,
  restoreDatabase,
  migrateDatabase,
  exportConnections,
  importConnections,
} from "@/lib/api";
import {
  Database,
  Download,
  Upload,
  FileJson,
  Plus,
  Loader2,
} from "lucide-react";

export default function Home() {
  const [connections, setConnections] = useState<ConnectionConfig[]>([]);
  const [activeTab, setActiveTab] = useState("connections");
  const [showAddForm, setShowAddForm] = useState(false);

  // Backup state
  const [backupConnection, setBackupConnection] =
    useState<ConnectionConfig | null>(null);
  const [backupFormat, setBackupFormat] = useState<"sql" | "custom">("sql");
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupResult, setBackupResult] = useState<any>(null);

  // Restore state
  const [restoreConnection, setRestoreConnection] =
    useState<ConnectionConfig | null>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);

  // Migrate state
  const [migrateSource, setMigrateSource] = useState<ConnectionConfig | null>(
    null
  );
  const [migrateTarget, setMigrateTarget] = useState<ConnectionConfig | null>(
    null
  );
  const [migrateLoading, setMigrateLoading] = useState(false);
  const [migrateResult, setMigrateResult] = useState<any>(null);

  useEffect(() => {
    const loaded = loadConnections();
    setConnections(loaded);
  }, []);

  const handleAddConnection = async (config: ConnectionConfig) => {
    const updated = [...connections, config];
    setConnections(updated);
    saveConnections(updated);
    setShowAddForm(false);
  };

  const handleDeleteConnection = (id: string) => {
    const updated = connections.filter((c) => c.id !== id);
    setConnections(updated);
    saveConnections(updated);
  };

  const handleBackup = async () => {
    if (!backupConnection) return;

    setBackupLoading(true);
    try {
      const result = await createBackup(backupConnection, backupFormat);
      setBackupResult(result);
    } catch (error) {
      alert(`Backup failed: ${error}`);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreConnection || !restoreFile) return;

    setRestoreLoading(true);
    try {
      await restoreDatabase(restoreConnection, restoreFile);
      alert("Database restored successfully!");
      setRestoreFile(null);
      setRestoreConnection(null);
    } catch (error) {
      alert(`Restore failed: ${error}`);
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleMigrate = async () => {
    if (!migrateSource || !migrateTarget) return;

    setMigrateLoading(true);
    try {
      const result = await migrateDatabase(migrateSource, migrateTarget);
      setMigrateResult(result);
      alert("Migration completed successfully!");
    } catch (error) {
      alert(`Migration failed: ${error}`);
    } finally {
      setMigrateLoading(false);
    }
  };

  const handleExport = () => {
    const json = exportConnections();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `db-connections-${Date.now()}.json`;
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = importConnections(event.target?.result as string);
        setConnections(imported);
        alert("Connections imported successfully!");
      } catch (error) {
        alert("Failed to import connections. Invalid file format.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Database className="h-10 w-10" />
              Database Management Portal
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage, backup, restore, and migrate your databases
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <label>
              <Button variant="outline" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </span>
              </Button>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
            </label>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
            <TabsTrigger value="restore">Restore</TabsTrigger>
            <TabsTrigger value="migrate">Migrate</TabsTrigger>
          </TabsList>

          {/* Connections Tab */}
          <TabsContent value="connections" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Your Connections</h2>
              <Button onClick={() => setShowAddForm(!showAddForm)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Connection
              </Button>
            </div>

            {showAddForm && (
              <ConnectionForm
                onSubmit={handleAddConnection}
                submitLabel="Add Connection"
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {connections.map((conn) => (
                <ConnectionCard
                  key={conn.id}
                  connection={conn}
                  onDelete={handleDeleteConnection}
                  onTest={() => {}}
                  onBackup={(c) => {
                    setBackupConnection(c);
                    setActiveTab("backup");
                  }}
                  onRestore={(c) => {
                    setRestoreConnection(c);
                    setActiveTab("restore");
                  }}
                  onMigrateFrom={(c) => {
                    setMigrateSource(c);
                    setActiveTab("migrate");
                  }}
                />
              ))}
            </div>

            {connections.length === 0 && !showAddForm && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Database className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-xl font-semibold mb-2">
                    No connections yet
                  </p>
                  <p className="text-muted-foreground mb-4">
                    Add your first database connection to get started
                  </p>
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Connection
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Backup Tab */}
          <TabsContent value="backup">
            <Card>
              <CardHeader>
                <CardTitle>Create Database Backup</CardTitle>
                <CardDescription>
                  Export your database to a SQL file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Connection</Label>
                  <Select
                    value={backupConnection?.id || ""}
                    onValueChange={(id) => {
                      const conn = connections.find((c) => c.id === id);
                      setBackupConnection(conn || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a connection..." />
                    </SelectTrigger>
                    <SelectContent>
                      {connections.map((conn) => (
                        <SelectItem key={conn.id} value={conn.id!}>
                          {conn.name} ({conn.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select
                    value={backupFormat}
                    onValueChange={(v: any) => setBackupFormat(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sql">SQL (Plain Text)</SelectItem>
                      <SelectItem value="custom">
                        Custom (Compressed)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleBackup}
                  disabled={!backupConnection || backupLoading}
                  className="w-full"
                >
                  {backupLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Backup
                </Button>

                {backupResult && (
                  <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <CardContent className="pt-6 space-y-2">
                      <p className="font-semibold">
                        Backup created successfully!
                      </p>
                      <p className="text-sm">File: {backupResult.fileName}</p>
                      <p className="text-sm">
                        Size: {(backupResult.fileSize / 1024).toFixed(2)} KB
                      </p>
                      <Button
                        onClick={() => downloadBackup(backupResult.backupId)}
                        className="w-full mt-4"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Backup
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Restore Tab */}
          <TabsContent value="restore">
            <Card>
              <CardHeader>
                <CardTitle>Restore Database</CardTitle>
                <CardDescription>
                  Upload a backup file to restore
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Connection</Label>
                  <Select
                    value={restoreConnection?.id || ""}
                    onValueChange={(id) => {
                      const conn = connections.find((c) => c.id === id);
                      setRestoreConnection(conn || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a connection..." />
                    </SelectTrigger>
                    <SelectContent>
                      {connections.map((conn) => (
                        <SelectItem key={conn.id} value={conn.id!}>
                          {conn.name} ({conn.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Backup File</Label>
                  <Input
                    type="file"
                    accept=".sql,.dump,.backup"
                    onChange={(e) =>
                      setRestoreFile(e.target.files?.[0] || null)
                    }
                  />
                </div>

                <Button
                  onClick={handleRestore}
                  disabled={
                    !restoreConnection || !restoreFile || restoreLoading
                  }
                  className="w-full"
                  variant="destructive"
                >
                  {restoreLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Restore Database (Destructive)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Migrate Tab */}
          <TabsContent value="migrate">
            <Card>
              <CardHeader>
                <CardTitle>Migrate Database</CardTitle>
                <CardDescription>
                  Copy data from one database to another
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Source Database</Label>
                  <Select
                    value={migrateSource?.id || ""}
                    onValueChange={(id) => {
                      const conn = connections.find((c) => c.id === id);
                      setMigrateSource(conn || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose source..." />
                    </SelectTrigger>
                    <SelectContent>
                      {connections.map((conn) => (
                        <SelectItem key={conn.id} value={conn.id!}>
                          {conn.name} ({conn.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target Database</Label>
                  <Select
                    value={migrateTarget?.id || ""}
                    onValueChange={(id) => {
                      const conn = connections.find((c) => c.id === id);
                      setMigrateTarget(conn || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose target..." />
                    </SelectTrigger>
                    <SelectContent>
                      {connections.map((conn) => (
                        <SelectItem
                          key={conn.id}
                          value={conn.id!}
                          disabled={conn.id === migrateSource?.id}
                        >
                          {conn.name} ({conn.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleMigrate}
                  disabled={!migrateSource || !migrateTarget || migrateLoading}
                  className="w-full"
                >
                  {migrateLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Start Migration
                </Button>

                {migrateResult && (
                  <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <CardContent className="pt-6 space-y-2">
                      <p className="font-semibold">Migration completed!</p>
                      <p className="text-sm">
                        From: {migrateResult.details?.source}
                      </p>
                      <p className="text-sm">
                        To: {migrateResult.details?.target}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
