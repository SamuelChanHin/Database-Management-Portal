# Quick Start Guide

Get the Database Management mobile app running in 5 minutes.

## Installation

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with your phone's camera (iOS) or Expo Go app (Android).

## First Steps

### 1. Add Your First Connection

1. Open the **Connections** tab
2. Tap **Add Connection**
3. Fill in details:
   - **Name**: My Database
   - **Type**: SQLite (easiest to test)
   - **Path**: `/path/to/your.db`
4. Tap **Save**

### 2. Test the Connection

1. Go to the **Health** tab
2. Find your connection
3. Tap **Check Status**
4. See version, latency, and status

### 3. Create a Backup

1. Go to the **Backup** tab
2. Select your connection
3. Tap **Create Backup**
4. Share or save the SQL file

### 4. Try Migration (Optional)

1. Add a second connection (different type)
2. Go to the **Migrate** tab
3. Select source and target
4. Tap **Start Migration**
5. Watch the progress bars

## Testing with SQLite

Create a test database:

```bash
sqlite3 test.db
```

```sql
CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);
INSERT INTO users VALUES (1, 'Alice'), (2, 'Bob');
.quit
```

Get the path:

```bash
realpath test.db
```

Use this path in the mobile app!

## Troubleshooting

**App won't start?**

```bash
npm install
expo doctor --fix-dependencies
```

**Can't connect to database?**

- Ensure database server is running
- Check host/port/credentials
- Make sure device is on same network (or use VPN)

**SecureStore errors?**

- Use physical device (not simulator) for secure storage
- Simulators fall back to AsyncStorage

## Next Steps

- Add connections for your production databases (RDS, Supabase, etc.)
- Set up regular backups
- Try cross-database migration
- Check out the full [README](README.md) for advanced features

## Quick Reference

| Tab         | Purpose                              |
| ----------- | ------------------------------------ |
| Connections | Add/edit/delete database connections |
| Health      | Test connections and view status     |
| Backup      | Export database to SQL file          |
| Restore     | Import SQL file to database          |
| Migrate     | Copy data between databases          |

## Security Notes

- Passwords are encrypted with hardware-backed storage
- All operations are client-side (no backend server)
- Backups are stored locally on device
- Use strong passwords for production databases

## Building for Production

### iOS

1. Sign up for [Expo Application Services](https://expo.dev)
2. Run: `eas build --platform ios`
3. Submit to App Store: `eas submit --platform ios`

### Android

1. Run: `eas build --platform android`
2. Submit to Play Store: `eas submit --platform android`

---

**Happy database managing! 🚀**
