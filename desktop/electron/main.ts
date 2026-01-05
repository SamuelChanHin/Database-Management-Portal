import { app, BrowserWindow, ipcMain, dialog, Menu, Tray } from "electron";
import path from "path";
import { DatabaseDriverFactory } from "./database/driver-factory";
import { ConnectionConfig } from "./database/types";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const isDev = process.env.NODE_ENV === "development";

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 15, y: 15 },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  createMenu();
  createTray();
}

function createMenu() {
  const template: any = [
    {
      label: "File",
      submenu: [
        { label: "New Connection", accelerator: "CmdOrCtrl+N" },
        { type: "separator" },
        { label: "Import Backup...", accelerator: "CmdOrCtrl+O" },
        { label: "Export Backup...", accelerator: "CmdOrCtrl+S" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Database",
      submenu: [
        { label: "Test Connection", accelerator: "CmdOrCtrl+T" },
        { label: "Backup Database", accelerator: "CmdOrCtrl+B" },
        { label: "Restore Database", accelerator: "CmdOrCtrl+R" },
        { type: "separator" },
        { label: "Migrate Database", accelerator: "CmdOrCtrl+M" },
      ],
    },
    {
      role: "help",
      submenu: [
        {
          label: "Learn More",
          click: async () => {
            const { shell } = require("electron");
            await shell.openExternal("https://github.com");
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createTray() {
  // tray = new Tray(path.join(__dirname, '../build/tray-icon.png'));
  // const contextMenu = Menu.buildFromTemplate([
  //   { label: 'Show App', click: () => mainWindow?.show() },
  //   { label: 'Quit', click: () => app.quit() }
  // ]);
  // tray.setToolTip('Database Portal');
  // tray.setContextMenu(contextMenu);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle("test-connection", async (event, config: ConnectionConfig) => {
  try {
    const driver = DatabaseDriverFactory.create(config);
    const result = await driver.healthCheck();
    await driver.close();
    return result;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Connection failed",
    };
  }
});

ipcMain.handle(
  "backup-database",
  async (event, config: ConnectionConfig, options: any) => {
    try {
      const driver = DatabaseDriverFactory.create(config);

      // Show save dialog
      const { filePath } = await dialog.showSaveDialog({
        title: "Save Database Backup",
        defaultPath: `${config.database}_${
          new Date().toISOString().split("T")[0]
        }.sql`,
        filters: [
          { name: "SQL Files", extensions: ["sql"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });

      if (!filePath) {
        return { success: false, message: "Backup cancelled" };
      }

      const result = await driver.backup(options, filePath);
      await driver.close();

      return { success: true, filePath, ...result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

ipcMain.handle("restore-database", async (event, config: ConnectionConfig) => {
  try {
    // Show open dialog
    const { filePaths } = await dialog.showOpenDialog({
      title: "Select Backup File",
      filters: [
        { name: "SQL Files", extensions: ["sql"] },
        { name: "All Files", extensions: ["*"] },
      ],
      properties: ["openFile"],
    });

    if (!filePaths || filePaths.length === 0) {
      return { success: false, message: "Restore cancelled" };
    }

    const driver = DatabaseDriverFactory.create(config);
    await driver.restore(filePaths[0]);
    await driver.close();

    return { success: true, message: "Database restored successfully" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

ipcMain.handle(
  "migrate-database",
  async (
    event,
    sourceConfig: ConnectionConfig,
    targetConfig: ConnectionConfig
  ) => {
    try {
      const sourceDriver = DatabaseDriverFactory.create(sourceConfig);
      const targetDriver = DatabaseDriverFactory.create(targetConfig);

      // Dump from source
      const tempFile = path.join(
        app.getPath("temp"),
        `migration_${Date.now()}.sql`
      );
      await sourceDriver.backup({}, tempFile);

      // Restore to target
      await targetDriver.restore(tempFile);

      await sourceDriver.close();
      await targetDriver.close();

      return { success: true, message: "Migration completed successfully" };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

ipcMain.handle("pick-file", async (event, options) => {
  const result = await dialog.showOpenDialog(options);
  return result.filePaths;
});

ipcMain.handle("save-file", async (event, options) => {
  const result = await dialog.showSaveDialog(options);
  return result.filePath;
});

ipcMain.handle("select-file", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      { name: "SQLite Database", extensions: ["db", "sqlite", "sqlite3"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });
  return result.filePaths[0];
});
