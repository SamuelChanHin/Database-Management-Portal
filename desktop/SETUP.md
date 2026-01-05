# Desktop App - Quick Setup

## Install Dependencies

```bash
cd desktop
npm install
```

## Run Development Mode

```bash
npm run dev
```

This will:

1. Start Vite dev server (frontend)
2. Launch Electron with hot reload

## Build Desktop App

### macOS

```bash
npm run dist:mac
```

Output: `release/<version>/DB Portal.dmg`

### Windows

```bash
npm run dist:win
```

Output: `release/<version>/DB Portal Setup.exe`

## What You Get

✅ **Native Desktop App** - No browser needed  
✅ **Full CLI Access** - pg_dump, mysqldump, sqlite3  
✅ **Native Dialogs** - File pickers, save dialogs  
✅ **Menu Bar** - File → Database → Help  
✅ **Keyboard Shortcuts** - Cmd+N, Cmd+B, Cmd+R, etc.  
✅ **Cross-Platform** - Same codebase for Mac/Windows/Linux

## Next Steps

1. **Copy your web components** from `web/components` to `desktop/src/components`
2. **Adapt API calls** - Replace `fetch('/api/...')` with `window.electronAPI.testConnection()`
3. **Test locally** - `npm run dev`
4. **Build** - `npm run dist:mac`

## Architecture

```
User clicks "Backup" button
    ↓
React Component calls window.electronAPI.backupDatabase()
    ↓
Preload.ts forwards to Main Process
    ↓
Main Process spawns pg_dump CLI
    ↓
Native save dialog appears
    ↓
Backup file saved to user's chosen location
```

**Key Difference from Web:**

- Web: Browser → API Server → Database
- Desktop: Electron → Native CLI Tools → Database (direct!)

Your desktop app has **full Node.js powers**! 🚀
