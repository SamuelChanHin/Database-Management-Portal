"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConnectionConfig } from "@/lib/api";
import { Database, Loader2 } from "lucide-react";

interface ConnectionFormProps {
  onSubmit: (config: ConnectionConfig) => Promise<void>;
  initialData?: Partial<ConnectionConfig>;
  submitLabel?: string;
  isLoading?: boolean;
}

export function ConnectionForm({
  onSubmit,
  initialData,
  submitLabel = "Save Connection",
  isLoading,
}: ConnectionFormProps) {
  const { register, handleSubmit, watch, setValue } = useForm<ConnectionConfig>(
    {
      defaultValues: {
        type: "postgres",
        port: 5432,
        ssl: false,
        ...initialData,
      },
    }
  );

  const dbType = watch("type");

  const onFormSubmit = async (data: ConnectionConfig) => {
    // Generate ID if new
    if (!data.id) {
      data.id = Date.now().toString();
    }
    await onSubmit(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Connection
        </CardTitle>
        <CardDescription>
          Configure your database connection. Credentials are stored locally
          only.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Connection Name</Label>
            <Input
              id="name"
              {...register("name", { required: true })}
              placeholder="Production DB"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Database Type</Label>
            <Select
              value={dbType}
              onValueChange={(value) => {
                setValue("type", value as any);
                // Set default ports
                if (value === "postgres") setValue("port", 5432);
                if (value === "mysql") setValue("port", 3306);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="postgres">PostgreSQL</SelectItem>
                <SelectItem value="mysql">MySQL</SelectItem>
                <SelectItem value="sqlite">SQLite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {dbType !== "sqlite" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="host">Host</Label>
                  <Input
                    id="host"
                    {...register("host")}
                    placeholder="localhost"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    type="number"
                    {...register("port", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user">Username</Label>
                <Input
                  id="user"
                  {...register("user", {
                    required: dbType === "postgres" || dbType === "mysql",
                  })}
                  placeholder="postgres"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password", {
                    required: dbType === "postgres" || dbType === "mysql",
                  })}
                  placeholder="••••••••"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="database">
              {dbType === "sqlite" ? "Database File Path" : "Database Name"}
            </Label>
            <Input
              id="database"
              {...register("database", { required: true })}
              placeholder={
                dbType === "sqlite" ? "/path/to/database.db" : "mydb"
              }
            />
          </div>

          {dbType !== "sqlite" && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ssl"
                {...register("ssl")}
                className="rounded border-gray-300"
              />
              <Label htmlFor="ssl" className="cursor-pointer">
                Enable SSL
              </Label>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
