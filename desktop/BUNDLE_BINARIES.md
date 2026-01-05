# Bundling Database Binaries with the Desktop App

This app bundles PostgreSQL and MySQL command-line tools so users don't need to install them separately.

## Setup for Development

### macOS

1. **Install database tools** (if not already installed):

   ```bash
   brew install postgresql@17
   brew install mysql
   ```

2. **Run the bundler script**:

   ```bash
   npm run postinstall
   ```

   This will automatically copy binaries from Homebrew to `binaries/darwin/`

3. **Verify binaries**:

   ```bash
   ls -la binaries/darwin/
   ```

   You should see:

   - `pg_dump`, `psql`, `pg_restore` (PostgreSQL)
   - `mysqldump`, `mysql` (MySQL)

### Windows

1. **Download PostgreSQL**:

   - Visit: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
   - Download the ZIP version (not installer)
   - Extract and copy to `binaries/win32/`:
     - `pg_dump.exe`
     - `psql.exe`
     - `libpq.dll` and other required DLLs from the `bin/` folder

2. **Download MySQL**:
   - Visit: https://dev.mysql.com/downloads/mysql/
   - Download the ZIP Archive
   - Extract and copy to `binaries/win32/`:
     - `mysqldump.exe`
     - `mysql.exe`
     - `libmysql.dll` and other required DLLs from the `bin/` folder

### Linux

1. **Install tools**:

   ```bash
   sudo apt-get install postgresql-client mysql-client
   ```

2. **Copy binaries**:
   ```bash
   mkdir -p binaries/linux
   cp /usr/bin/pg_dump binaries/linux/
   cp /usr/bin/psql binaries/linux/
   cp /usr/bin/mysqldump binaries/linux/
   cp /usr/bin/mysql binaries/linux/
   ```

## How It Works

1. **Development Mode** (`npm run dev`):

   - App uses system-installed binaries (pg_dump, mysqldump from PATH)
   - No bundling needed for development

2. **Production Build** (`npm run dist:mac`):

   - Binaries from `binaries/{platform}/` are copied to the app package
   - On macOS: `DB Portal.app/Contents/Resources/bin/`
   - On Windows: `resources/bin/`
   - The app automatically uses bundled binaries when packaged

3. **Binary Resolution**:
   - The `getBinaryPath()` function in `electron/utils/bundled-binaries.ts` handles detection
   - In dev mode: Returns binary name (uses system PATH)
   - In production: Returns full path to bundled binary
   - Fallback: If bundled binary not found, tries system binary

## File Structure

```
desktop/
├── binaries/
│   ├── darwin/           # macOS binaries
│   │   ├── pg_dump
│   │   ├── psql
│   │   ├── mysqldump
│   │   └── mysql
│   ├── win32/            # Windows binaries
│   │   ├── pg_dump.exe
│   │   ├── psql.exe
│   │   ├── mysqldump.exe
│   │   ├── mysql.exe
│   │   └── *.dll
│   └── linux/            # Linux binaries
│       ├── pg_dump
│       ├── psql
│       ├── mysqldump
│       └── mysql
├── electron/
│   └── utils/
│       └── bundled-binaries.ts  # Binary path resolution
└── package.json          # extraResources config
```

## Building the Installer

Once binaries are in place:

```bash
# macOS
npm run dist:mac

# Windows (from Windows machine)
npm run dist:win

# Linux
npm run dist:linux
```

The resulting installer will include all database binaries and work on machines without PostgreSQL/MySQL installed.

## Testing

1. **Build the app**:

   ```bash
   npm run dist:mac
   ```

2. **Test on a clean machine** (or VM without databases installed):
   - Install the DMG/installer
   - Add a PostgreSQL or MySQL connection
   - Try backup/restore functionality
   - Should work without any additional installations!

## Troubleshooting

**Binaries not found after build:**

- Check `binaries/{platform}/` folder exists and has files
- Verify `package.json` → `build.extraResources` config
- Check electron-builder output for copy errors

**Permission errors on macOS/Linux:**

```bash
chmod +x binaries/darwin/*
# or
chmod +x binaries/linux/*
```

**DLL errors on Windows:**

- Make sure all required DLLs are in `binaries/win32/`
- Use Dependency Walker to find missing DLLs
- Common ones: libpq.dll, libeay32.dll, ssleay32.dll, libmysql.dll

**Version mismatch warnings:**

- These are informational only
- Bundled pg_dump works with different server versions
- If needed, bundle specific versions for compatibility
