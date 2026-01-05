import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // Database operations
  testConnection: (config: any) =>
    ipcRenderer.invoke("test-connection", config),
  backupDatabase: (config: any, options: any) =>
    ipcRenderer.invoke("backup-database", config, options),
  restoreDatabase: (config: any) =>
    ipcRenderer.invoke("restore-database", config),
  migrateDatabase: (sourceConfig: any, targetConfig: any) =>
    ipcRenderer.invoke("migrate-database", sourceConfig, targetConfig),

  // File dialogs
  pickFile: (options: any) => ipcRenderer.invoke("pick-file", options),
  saveFile: (options: any) => ipcRenderer.invoke("save-file", options),
  selectFile: () => ipcRenderer.invoke("select-file"),

  // Platform info
  platform: process.platform,
  isElectron: true,
});

// Type definitions for TypeScript
export interface ElectronAPI {
  testConnection: (config: any) => Promise<any>;
  backupDatabase: (config: any, options: any) => Promise<any>;
  restoreDatabase: (config: any) => Promise<any>;
  migrateDatabase: (sourceConfig: any, targetConfig: any) => Promise<any>;
  pickFile: (options: any) => Promise<string[]>;
  saveFile: (options: any) => Promise<string | undefined>;
  selectFile: () => Promise<string | undefined>;
  platform: string;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
