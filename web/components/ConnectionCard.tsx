"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConnectionConfig, testConnection } from "@/lib/api";
import {
  Database,
  Trash2,
  TestTube,
  Download,
  Upload,
  ArrowRightLeft,
  Edit,
} from "lucide-react";

interface ConnectionCardProps {
  connection: ConnectionConfig;
  healthStatus: { ok: boolean; version?: string; latency?: number } | null;
  onDelete: (id: string) => void;
  onEdit: (connection: ConnectionConfig) => void;
  onTest: (result: { ok: boolean; version?: string; latency?: number }) => void;
  onBackup: (connection: ConnectionConfig) => void;
  onRestore: (connection: ConnectionConfig) => void;
  onMigrateFrom: (connection: ConnectionConfig) => void;
}

export function ConnectionCard({
  connection,
  healthStatus,
  onDelete,
  onEdit,
  onTest,
  onBackup,
  onRestore,
  onMigrateFrom,
}: ConnectionCardProps) {
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await testConnection(connection);
      onTest(result);
    } catch (error) {
      onTest({ ok: false });
    } finally {
      setTesting(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "postgres":
        return "bg-blue-500";
      case "mysql":
        return "bg-orange-500";
      case "sqlite":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card className="relative">
      <div
        className={`absolute top-0 left-0 w-1 h-full rounded-l-lg ${getTypeColor(
          connection.type
        )}`}
      />

      <CardHeader className="pl-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <div>
              <CardTitle>{connection.name}</CardTitle>
              <CardDescription className="mt-1">
                {connection.type.toUpperCase()} • {connection.database}
                {connection.host && ` • ${connection.host}`}
              </CardDescription>
            </div>
          </div>

          {healthStatus !== null && (
            <div
              className={`h-3 w-3 rounded-full ${
                healthStatus.ok ? "bg-green-500" : "bg-red-500"
              }`}
            />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {healthStatus && healthStatus.ok && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Version:</span> {healthStatus.version}{" "}
            •<span className="font-medium"> Latency:</span>{" "}
            {healthStatus.latency}ms
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleTest}
            disabled={testing}
          >
            <TestTube className="h-4 w-4 mr-1" />
            Test
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onBackup(connection)}
          >
            <Download className="h-4 w-4 mr-1" />
            Backup
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onRestore(connection)}
          >
            <Upload className="h-4 w-4 mr-1" />
            Restore
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onMigrateFrom(connection)}
          >
            <ArrowRightLeft className="h-4 w-4 mr-1" />
            Migrate
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(connection)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(connection.id!)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
