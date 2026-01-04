# 🚀 Database Management Portal

A self-hosted web portal to manage multiple PostgreSQL, MySQL, and SQLite databases. Test connections, create backups, restore from SQL files, and migrate data between databases—all from a clean, responsive interface.

## Features

✅ **Multi-Database Support**: PostgreSQL, MySQL, SQLite  
✅ **Connection Testing**: Health checks with latency and version info  
✅ **Backup & Restore**: Export to SQL/custom formats, upload to restore  
✅ **Database Migration**: One-click migration between different databases  
✅ **Local Storage**: Connections saved in browser localStorage (no server-side credentials)  
✅ **Import/Export**: Export connection configs as JSON  
✅ **Docker Compose**: One command to run both web and API services  
✅ **Security**: Rate limiting, CORS, Helmet.js, file size limits

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, React Hook Form
- **Backend**: Node.js 20, Express, TypeScript
- **Database Drivers**: pg (PostgreSQL), mysql2 (MySQL), better-sqlite3 (SQLite)
- **Docker**: Complete containerization with CLI tools included

## Project Structure

```
db-portal/
├── docker-compose.yml       # Orchestrates web + api services
├── data/                    # Volume for backup files
├── web/                     # Next.js frontend
│   ├── app/                 # App Router pages
│   ├── components/          # React components (shadcn/ui)
│   ├── lib/                 # API utilities
│   └── Dockerfile
└── api/                     # Express backend
    ├── src/
    │   ├── drivers/         # Database driver abstractions
    │   ├── routes/          # API endpoints
    │   ├── middleware/      # Error handling, etc.
    │   └── index.ts         # Server entry point
    └── Dockerfile
```

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- No other services on ports 3000 (web) or 4000 (api)

### Installation

1. **Clone or create the project folder**:

   ```bash
   cd /Users/samuel/Documents/tools/database/monitor-tool
   ```

2. **Install dependencies** (for local development):

   ```bash
   # API
   cd api
   npm install

   # Web
   cd ../web
   npm install
   ```

3. **Run with Docker Compose**:

   ```bash
   # From project root
   docker compose up --build
   ```

4. **Access the portal**:
   - Web UI: http://localhost:3000
   - API: http://localhost:4000
   - Health Check: http://localhost:4000/health

### Local Development (without Docker)

```bash
# Terminal 1 - API
cd api
npm run dev

# Terminal 2 - Web
cd web
npm run dev
```

## API Endpoints

### Connection Testing

```bash
curl -X POST http://localhost:4000/api/connect/test \
  -H "Content-Type: application/json" \
  -d '{
    "type": "postgres",
    "host": "localhost",
    "port": 5432,
    "database": "mydb",
    "user": "postgres",
    "password": "password"
  }'
```

### Create Backup

```bash
curl -X POST http://localhost:4000/api/backup \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "type": "postgres",
      "host": "localhost",
      "port": 5432,
      "database": "mydb",
      "user": "postgres",
      "password": "password"
    },
    "format": "sql"
  }'
```

### Download Backup

```bash
curl -O http://localhost:4000/api/backup/{backupId}
```

### Restore Database

```bash
curl -X POST http://localhost:4000/api/restore \
  -F 'file=@backup.sql' \
  -F 'config={"type":"postgres","host":"localhost","port":5432,"database":"mydb","user":"postgres","password":"password"}'
```

### Migrate Database

```bash
curl -X POST http://localhost:4000/api/migrate \
  -H "Content-Type: application/json" \
  -d '{
    "sourceConfig": {
      "type": "postgres",
      "host": "source-host",
      "database": "sourcedb",
      "user": "user",
      "password": "pass"
    },
    "targetConfig": {
      "type": "mysql",
      "host": "target-host",
      "database": "targetdb",
      "user": "user",
      "password": "pass"
    }
  }'
```

## Usage Guide

### Adding a Connection

1. Navigate to **Connections** tab
2. Click **Add Connection**
3. Fill in database details:
   - Connection Name (friendly name)
   - Database Type (PostgreSQL/MySQL/SQLite)
   - Host, Port, Username, Password (for PostgreSQL/MySQL)
   - Database name or file path (for SQLite)
4. Click **Add Connection**

### Testing a Connection

- Click the **Test** button on any connection card
- View health status (green/red dot), version, and latency

### Creating a Backup

1. Go to **Backup** tab
2. Select a connection from the dropdown
3. Choose format (SQL or Custom)
4. Click **Create Backup**
5. Download the generated file

### Restoring a Database

1. Go to **Restore** tab
2. Select target connection
3. Upload a backup file (.sql, .dump, .backup)
4. Click **Restore Database** (⚠️ destructive operation)

### Migrating Between Databases

1. Go to **Migrate** tab
2. Select source database
3. Select target database (must be different)
4. Click **Start Migration**
5. Wait for completion confirmation

### Import/Export Connections

- **Export**: Click **Export** button to download connections as JSON
- **Import**: Click **Import** and select a previously exported JSON file

## Security Features

🔒 **Credentials Never Stored on Server**: All connection configs live in browser localStorage  
🔒 **Rate Limiting**: 100 requests per 15 minutes per IP  
🔒 **File Size Limits**: 100MB max for uploads  
🔒 **Operation Timeouts**: 30-second timeout for operations  
🔒 **Auto-Cleanup**: Backup files deleted after 24 hours  
🔒 **CORS Protection**: Restricted to localhost:3000  
🔒 **Helmet.js**: Security headers enabled

## Configuration

### Environment Variables

**API** (`api/.env`):

```env
PORT=4000
NODE_ENV=production
UPLOAD_DIR=/app/data
```

**Web** (`web/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Docker Compose Customization

To change ports, edit `docker-compose.yml`:

```yaml
services:
  web:
    ports:
      - "8080:3000" # Change 8080 to your desired port
  api:
    ports:
      - "5000:4000" # Change 5000 to your desired port
```

## Troubleshooting

### Connection Failures

- Verify database credentials and network accessibility
- For cloud databases (RDS, Cloud SQL), ensure firewall rules allow connections
- For SQLite, ensure the file path is correct and readable

### Docker Issues

```bash
# Rebuild containers
docker compose down
docker compose up --build

# View logs
docker compose logs -f

# Check container status
docker compose ps
```

### Port Conflicts

If ports 3000 or 4000 are in use:

```bash
# Find process using port
lsof -i :3000
lsof -i :4000

# Kill process or change ports in docker-compose.yml
```

## Development

### Adding a New Database Driver

1. Create driver in `api/src/drivers/`:

   ```typescript
   export class NewDBDriver extends DatabaseDriver {
     async healthCheck() {
       /* ... */
     }
     async backup() {
       /* ... */
     }
     async restore() {
       /* ... */
     }
     async close() {
       /* ... */
     }
   }
   ```

2. Update factory in `api/src/drivers/index.ts`:

   ```typescript
   case 'newdb':
     return new NewDBDriver(config);
   ```

3. Add to connection type in `api/src/types/database.ts`

### Building for Production

```bash
# Build both services
docker compose build

# Push to registry (optional)
docker tag db-portal-web:latest your-registry/db-portal-web
docker tag db-portal-api:latest your-registry/db-portal-api
docker push your-registry/db-portal-web
docker push your-registry/db-portal-api
```

## License

MIT

## Contributing

PRs welcome! Please ensure:

- TypeScript types are correct
- Error handling is comprehensive
- Security best practices are maintained
- Credentials are never logged or persisted

## Roadmap

- [ ] PostgreSQL connection pooling
- [ ] Scheduled backups (cron-like)
- [ ] Multi-file restore support
- [ ] Database query executor
- [ ] Schema comparison tool
- [ ] Backup encryption
- [ ] Multi-user support with authentication

---

**Built with ❤️ using Next.js, Express, and TypeScript**
