# Database Portal Desktop

Cross-platform desktop application for managing PostgreSQL, MySQL, and SQLite databases.

## Features

- ✅ **Full CLI Integration**: Native pg_dump, mysqldump, sqlite3 support
- ✅ **Cross-Platform**: Works on macOS, Windows, and Linux
- ✅ **Native Dialogs**: File pickers, save dialogs
- ✅ **Offline**: No backend server needed
- ✅ **Secure**: Credentials stored locally, never exposed

## Quick Start

### Development

```bash
cd desktop
npm install
npm run dev
```

### Build for Production

```bash
# macOS
npm run dist:mac

# Windows
npm run dist:win

# Linux
npm run dist:linux
```

### Installation

Built applications will be in `release/<version>/`:

- macOS: `.dmg` file
- Windows: `.exe` installer
- Linux: `.AppImage` or `.deb`

## Requirements

### For PostgreSQL Operations

- Install PostgreSQL: `brew install postgresql` (macOS) or download from [postgresql.org](https://www.postgresql.org/download/)
- Requires `pg_dump` and `psql` in PATH

### For MySQL Operations

- Install MySQL: `brew install mysql` (macOS) or download from [mysql.com](https://www.mysql.com/downloads/)
- Requires `mysqldump` and `mysql` in PATH

### For SQLite Operations

- SQLite is built-in (better-sqlite3 package)

## Usage

### 1. Add Connection

- Click "Add Connection"
- Select database type (PostgreSQL, MySQL, SQLite)
- Enter connection details
- Test connection

### 2. Backup Database

- Select connection
- Choose backup options (schema only, data only, or both)
- Click "Create Backup"
- Choose save location

### 3. Restore Database

- Select connection
- Click "Restore Database"
- Choose SQL backup file
- Confirm restore

### 4. Migrate Database

- Select source connection
- Select target connection
- Click "Start Migration"
- Data is automatically converted between database types

## Architecture

```
Desktop App (Electron)
├── Main Process (Node.js)
│   ├── Database Drivers
│   │   ├── PostgresDriver (pg + pg_dump)
│   │   ├── MySQLDriver (mysql2 + mysqldump)
│   │   └── SQLiteDriver (better-sqlite3)
│   └── IPC Handlers
└── Renderer Process (React + Vite)
    └── UI Components
```

## Security

- Credentials are stored in localStorage (encrypted at OS level)
- All database operations run locally
- No data sent to external servers
- CLI tools execute with environment variables (passwords not in command line)

## Troubleshooting

### "pg_dump not found" or "mysqldump not found"

**macOS:**

```bash
brew install postgresql
brew install mysql
```

**Windows:**
Add PostgreSQL/MySQL bin directories to PATH:

- PostgreSQL: `C:\Program Files\PostgreSQL\16\bin`
- MySQL: `C:\Program Files\MySQL\MySQL Server 8.0\bin`

**Linux:**

```bash
sudo apt install postgresql-client
sudo apt install mysql-client
```

### Connection Refused

- Ensure database server is running
- Check host/port/credentials
- For remote connections, check firewall rules

### File Permission Errors

- Run app with appropriate permissions
- Check backup/restore file paths are writable

## Development

### Project Structure

```
desktop/
├── electron/          # Electron main process
│   ├── main.ts       # App entry, window management
│   ├── preload.ts    # IPC bridge
│   └── database/     # Database drivers
├── src/              # React frontend
│   ├── App.tsx       # Main app component
│   └── components/   # UI components
├── vite.config.ts    # Vite + Electron config
└── package.json      # Dependencies & scripts
```

### Tech Stack

- **Electron**: Desktop app framework
- **Vite**: Fast build tool
- **React**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **pg**: PostgreSQL client
- **mysql2**: MySQL client
- **better-sqlite3**: SQLite client

## License

MIT
