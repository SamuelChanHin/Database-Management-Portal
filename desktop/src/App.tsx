import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import ConnectionsTab from "./components/ConnectionsTab";
import BackupTab from "./components/BackupTab";
import RestoreTab from "./components/RestoreTab";
import MigrateTab from "./components/MigrateTab";
import NavBar from "./components/NavBar";

export interface Connection {
  id: string;
  name: string;
  type: "postgres" | "mysql" | "sqlite";
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  filePath?: string;
}

function App() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] =
    useState<Connection | null>(null);

  // Load connections from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("connections");
    if (saved) {
      setConnections(JSON.parse(saved));
    }
  }, []);

  // Save connections to localStorage
  const saveConnections = (conns: Connection[]) => {
    setConnections(conns);
    localStorage.setItem("connections", JSON.stringify(conns));
  };

  const addConnection = (conn: Connection) => {
    saveConnections([...connections, { ...conn, id: Date.now().toString() }]);
  };

  const updateConnection = (id: string, conn: Partial<Connection>) => {
    saveConnections(
      connections.map((c) => (c.id === id ? { ...c, ...conn } : c))
    );
  };

  const deleteConnection = (id: string) => {
    saveConnections(connections.filter((c) => c.id !== id));
  };

  const handleExport = () => {
    // Export from the actual localStorage key used by ConnectionsTab
    const saved = localStorage.getItem("db-connections");
    const connectionsToExport = saved ? JSON.parse(saved) : [];

    // Map username -> user for web portal compatibility
    const mappedForExport = connectionsToExport.map((conn: any) => ({
      id: conn.id,
      name: conn.name,
      type: conn.type,
      host: conn.host,
      port: conn.port,
      database: conn.database,
      user: conn.username, // Map username -> user
      password: conn.password,
      filePath: conn.filePath,
      ssl: conn.ssl,
    }));

    const json = JSON.stringify(mappedForExport, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `db-connections-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (!Array.isArray(imported)) {
          alert("Failed to import connections. Invalid file format.");
          return;
        }

        // Map fields to match ConnectionsTab's DatabaseConnection interface
        const mappedConnections = imported.map((conn: any) => ({
          id: conn.id || Date.now().toString() + Math.random(),
          name: conn.name,
          type: conn.type, // Keep as-is, already using "postgres"
          host: conn.host,
          port: conn.port,
          database: conn.database,
          username: conn.username || conn.user, // Map user -> username
          password: conn.password,
          filePath: conn.filePath,
          ssl: conn.ssl || false,
        }));

        // Save to the correct localStorage key used by ConnectionsTab
        localStorage.setItem(
          "db-connections",
          JSON.stringify(mappedConnections)
        );
        alert(
          "Connections imported successfully! Please refresh the page or switch tabs to see the imported connections."
        );
        // Force reload the page to refresh all components
        window.location.reload();
      } catch (error) {
        alert("Failed to import connections. Invalid file format.");
      }
    };
    reader.readAsText(file);
    // Reset the input so the same file can be selected again
    e.target.value = "";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar onExport={handleExport} onImport={handleImport} />

      <div className="container mx-auto p-6">
        <Tabs defaultValue="connections" className="space-y-4">
          <TabsList>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
            <TabsTrigger value="restore">Restore</TabsTrigger>
            <TabsTrigger value="migrate">Migrate</TabsTrigger>
          </TabsList>

          <TabsContent value="connections">
            <ConnectionsTab
              connections={connections}
              onAdd={addConnection}
              onUpdate={updateConnection}
              onDelete={deleteConnection}
              onSelect={setSelectedConnection}
            />
          </TabsContent>

          <TabsContent value="backup">
            <BackupTab
              connections={connections}
              selectedConnection={selectedConnection}
            />
          </TabsContent>

          <TabsContent value="restore">
            <RestoreTab
              connections={connections}
              selectedConnection={selectedConnection}
            />
          </TabsContent>

          <TabsContent value="migrate">
            <MigrateTab connections={connections} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
