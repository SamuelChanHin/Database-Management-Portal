# Database Management Mobile App

A React Native mobile app for managing PostgreSQL, MySQL, and SQLite databases directly from your phone. Built with Expo for iOS and Android.

## Features

- ✅ **Connection Management**: Store and test database connections securely
- ✅ **Health Monitoring**: Check database status, version, and latency
- ✅ **Backup**: Create SQL backups of your databases
- ✅ **Restore**: Restore databases from SQL files
- ✅ **Migration**: Migrate data between different database types with automatic SQL dialect conversion
- 🔒 **Secure Storage**: Passwords stored with Expo SecureStore (encrypted)
- 📱 **Cross-platform**: Works on iOS and Android

## Technology Stack

- **Expo** - React Native framework
- **TypeScript** - Type-safe development
- **React Native Paper** - Material Design UI components
- **Expo Router** - File-based navigation
- **React Query** - Data fetching and caching
- **Zustand** - State management
- **Expo SQLite** - Local SQLite support
- **Expo SecureStore** - Encrypted credential storage
- **Expo FileSystem** - Backup file management

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app (for testing on physical device)

### Setup

1. Navigate to the mobile directory:

```bash
cd mobile
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npx expo start
```

4. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

## Usage

### 1. Connections Tab

Add and manage database connections:

- **SQLite**: Requires only a file path (stored locally on device)
- **PostgreSQL**: Requires host, port, database name, username, password
- **MySQL**: Requires host, port, database name, username, password

Credentials are stored securely using Expo SecureStore (hardware-backed encryption when available).

### 2. Health Tab

Test database connections and view:

- Connection status (healthy/unhealthy)
- Database version
- Connection latency
- Last check timestamp

### 3. Backup Tab

Create SQL backups of your databases:

1. Select a connection
2. Choose backup options (schema only or full backup)
3. Tap "Create Backup"
4. Share the backup file via iOS/Android share sheet

Backups are stored in the app's document directory and can be accessed via Files app.

### 4. Restore Tab

Restore databases from SQL backup files:

1. Select a connection
2. Choose an SQL file from your device
3. Confirm the restore operation
4. Monitor progress

⚠️ **Warning**: Restore operations may overwrite existing data.

### 5. Migrate Tab

Migrate data between different database types:

1. Select source database
2. Select target database
3. Start migration

The app automatically:

- Exports data from source
- Converts SQL dialect (e.g., PostgreSQL → MySQL)
- Imports to target database

## Security Model

- **Passwords**: Encrypted with Expo SecureStore (uses iOS Keychain / Android Keystore)
- **Connection Metadata**: Stored in AsyncStorage (not encrypted)
- **Network**: All database connections are direct from device to database
- **No Backend**: App operates entirely client-side

## Database Support

### ✅ SQLite (Fully Supported)

- Local databases stored on device
- Full CRUD operations
- Backup/restore via SQL export
- Migration source/target

### ⚠️ PostgreSQL (Partial Support)

- Connection testing works
- Backup/restore requires implementation
- Migration target works (via SQLite source)

### ⚠️ MySQL (Partial Support)

- Connection testing works
- Backup/restore requires implementation
- Migration target works (via SQLite source)

## Architecture

### Database Driver Abstraction

```typescript
interface DatabaseDriver {
  healthCheck(): Promise<HealthStatus>;
  listTables(): Promise<string[]>;
  dumpDatabase(options?: DumpOptions): Promise<string>;
  restoreDatabase(sql: string): Promise<void>;
  close(): Promise<void>;
}
```

Each database type (SQLite, PostgreSQL, MySQL) implements this interface.

### SQL Dialect Conversion

The `convertSql()` function automatically converts between SQL dialects:

- Data types (e.g., `AUTOINCREMENT` → `AUTO_INCREMENT`)
- Quote styles (backticks vs double quotes)
- Syntax differences

## File Storage

Backups are saved to:

```
{app_documents_directory}/backups/{database_name}_{timestamp}.sql
```

Access via:

- iOS: Files app → On My iPhone → Database Manager
- Android: Files app → Internal Storage → Database Manager

## Known Limitations

1. **PostgreSQL/MySQL**: Native client libraries not available in React Native, so backup/restore requires custom implementation
2. **Large Databases**: May hit memory limits on device
3. **Network**: Database must be accessible from mobile device (check firewall/VPN)

## Roadmap

- [ ] Implement native PostgreSQL driver (using react-native-pg or similar)
- [ ] Implement native MySQL driver
- [ ] Add query execution interface
- [ ] Add database schema browser
- [ ] Add export to CSV/JSON
- [ ] Add scheduled backups
- [ ] Add iCloud/Google Drive backup sync

## Development

### Project Structure

```
mobile/
├── app/
│   ├── _layout.tsx           # Root navigation
│   └── screens/              # Screen components
│       ├── ConnectionsScreen.tsx
│       ├── HealthScreen.tsx
│       ├── BackupScreen.tsx
│       ├── RestoreScreen.tsx
│       └── MigrateScreen.tsx
├── src/
│   ├── database/
│   │   ├── types.ts          # TypeScript types
│   │   ├── sqlConverter.ts   # SQL dialect conversion
│   │   └── drivers/          # Database drivers
│   │       ├── SQLiteDriver.ts
│   │       ├── PostgresDriver.ts
│   │       └── MySQLDriver.ts
│   ├── hooks/                # React Query hooks
│   │   ├── useConnections.ts
│   │   ├── useHealthCheck.ts
│   │   ├── useBackup.ts
│   │   ├── useRestore.ts
│   │   └── useMigration.ts
│   └── utils/
│       ├── storage.ts        # SecureStore + AsyncStorage
│       └── files.ts          # FileSystem operations
├── app.json                  # Expo configuration
├── package.json
└── tsconfig.json
```

### Building for Production

**iOS**:

```bash
eas build --platform ios
```

**Android**:

```bash
eas build --platform android
```

Requires Expo Application Services (EAS) account.

## Troubleshooting

### Connection Timeouts

- Ensure database is accessible from your network
- Check firewall rules
- Use VPN if database is on private network

### SecureStore Not Available

- SecureStore requires device with secure hardware
- Falls back to AsyncStorage on simulators (not secure)

### Large Backup Files

- Enable "Schema Only" for faster backups
- Split data into multiple migrations
- Use cloud database export features instead

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
