# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LoRaDB Web UI is a full-stack TypeScript application providing a web interface for LoRaDB (LoRaWAN database). It consists of two separate services:

- **Backend** (Node.js/Express): Generates JWT tokens and proxies requests to LoRaDB API
- **Frontend** (React/Vite): Web UI for device management and query execution

The UI is designed to run on a **separate server** from the LoRaDB instance and connects remotely via HTTP/HTTPS.

## Development Commands

### Backend Development
```bash
cd backend
npm install          # Install dependencies
npm run dev          # Start development server (ts-node-dev with auto-reload)
npm run build        # Compile TypeScript to dist/
npm start            # Run production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking without emitting files
```

### Frontend Development
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start Vite dev server (hot reload on http://localhost:5173)
npm run build        # Build for production (TypeScript compile + Vite build)
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking without emitting files
```

### Docker Deployment
```bash
# From repository root
docker compose up -d          # Build and start both services
docker compose down           # Stop and remove containers
docker compose logs -f        # Follow logs from both services
docker compose logs backend   # View backend logs only
docker compose logs frontend  # View frontend logs only
docker compose ps             # Check container status

# Rebuild after code changes
docker compose down
docker compose build --no-cache
docker compose up -d
```

## Architecture

### Request Flow
```
Browser → Frontend (nginx:3000) → Backend (Express:3001) → LoRaDB API (separate server:8080)
```

The architecture is a **proxy pattern** where:
1. Frontend makes API calls to the backend
2. Backend forwards authenticated requests to LoRaDB
3. Backend also generates JWT tokens for authentication

### Key Architectural Components

**Backend (`backend/src/`):**
- `index.ts` - Express server setup and route registration
- `routes/auth.ts` - JWT token generation and verification using jsonwebtoken
- `routes/proxy.ts` - Proxies requests to LoRaDB API using axios
- `middleware/cors.ts` - CORS configuration for frontend access
- `middleware/errorHandler.ts` - Centralized error handling
- `config/env.ts` - Environment variable validation and configuration

**Frontend (`frontend/src/`):**
- `App.tsx` - Root component with React Router setup and route definitions
- `context/AuthContext.tsx` - Authentication state management using React Context
- `api/client.ts` - Axios client with interceptor for JWT token injection
- `api/endpoints.ts` - Typed API functions for all backend endpoints
- `utils/queryBuilder.ts` - Builds LoRaDB query DSL from UI form inputs
- `components/Query/QueryInterface.tsx` - Visual query builder and raw editor
- `components/Devices/DeviceList.tsx` - Device listing with React Query
- `components/Layout/Dashboard.tsx` - Main layout with navigation sidebar

### Authentication Flow

1. **Login**: User enters username → Backend generates JWT with HS256 → Token stored in localStorage
2. **API Requests**: Axios interceptor (`api/client.ts`) adds `Authorization: Bearer <token>` header
3. **Verification**: Backend forwards token to LoRaDB, which validates using shared JWT_SECRET
4. **Token Expiry**: Frontend checks expiry on load, auto-logs out if expired

**Critical**: JWT_SECRET must be identical between UI backend and LoRaDB server.

### Query DSL

LoRaDB uses a SQL-like query language. The `queryBuilder.ts` utility constructs queries:

```
SELECT {* | uplink | downlink | field1, field2, ...}
FROM device 'DevEUI'
WHERE {LAST '1h' | SINCE '2025-01-01T00:00:00Z' | BETWEEN 'start' AND 'end'}
```

Time units: `ms`, `s`, `m`, `h`, `d`, `w`

## Environment Configuration

### Backend Environment Variables

**Required:**
- `JWT_SECRET` - Must match LoRaDB server (minimum 32 characters). Backend exits with error if not set or too short (see `config/env.ts:15-18`)
- `LORADB_API_URL` - URL to LoRaDB API (e.g., `http://192.168.1.100:8080`)

**Optional:**
- `PORT` - Backend port (default: 3001)
- `JWT_EXPIRATION_HOURS` - Default token expiration (default: 1)
- `CORS_ORIGIN` - Allowed frontend origin (default: `http://localhost:3000`)
- `MASTER_PASSWORD` - Plaintext password for master password protection (minimum 8 characters, see section below)
- `MASTER_SESSION_HOURS` - Master session duration in hours (default: 24)

### Frontend Environment Variables

**Optional:**
- `VITE_API_URL` - Backend API URL (default: `http://localhost:3001`). Set to UI server's IP for remote access (e.g., `http://192.168.1.200:3001`)

### Docker Compose Configuration

The `docker-compose.yml` creates a bridge network `loradb-network`. Environment variables are passed from `.env` file at repository root.

For remote deployments:
- `LORADB_API_URL` = IP/domain of LoRaDB server
- `VITE_API_URL` = IP of UI server (for browser access)
- `CORS_ORIGIN` = IP of UI server frontend

### Master Password Protection

Optional security layer that protects server management operations (add/edit/delete servers at `/servers/manage`).

**Setup:**

Simply add a password to your `.env` file:
```bash
# Add to .env file
MASTER_PASSWORD=your-secure-password-here
MASTER_SESSION_HOURS=24

# Restart backend to apply changes
docker compose restart backend
```

**Requirements:**
- Minimum 8 characters
- Maximum 72 characters
- Any characters allowed

**Configuration:**
- `MASTER_PASSWORD` - Plaintext password (minimum 8 characters, required for protection)
- `MASTER_SESSION_HOURS` - Session duration in hours (default: 24)

**Behavior:**
- If `MASTER_PASSWORD` is set: Users must enter master password before accessing `/servers/manage`
- If not set: Server management is unprotected (backward compatible)
- Master sessions expire after `MASTER_SESSION_HOURS` (default 24 hours)
- Rate limited to 5 attempts per 15 minutes per IP address
- Password verified using simple string comparison

**Security Notes:**
- Master password protects ONLY `/servers/manage` (create/update/delete operations)
- GET operations (listing servers, testing connections) are not protected
- Other admin features (Token Management, Retention Policies) remain protected by server authentication
- Backend middleware (`backend/src/middleware/masterAuth.ts`) validates JWT tokens with type='master'
- Frontend shows modal (`MasterPasswordModal.tsx`) when protection is enabled but user not authenticated
- **Warning:** Password stored in plaintext in `.env` file - ensure file permissions are restricted (600)

**Architecture:**
- Backend: JWT token generation (`/api/auth/verify-master-password`) with plaintext password comparison
- Frontend: React Context (`MasterAuthContext.tsx`) for session state, modal for password entry
- Route protection: `MasterProtectedRoute` wrapper component checks authentication status
- Token storage: localStorage with key `master_token` and expiration tracking

## State Management

- **Authentication**: React Context (`AuthContext.tsx`) with localStorage persistence
- **Server State**: TanStack React Query for API data caching and automatic refetching
- **Query Client Config**: Retry once, disable refetch on window focus (see `App.tsx:12-18`)

## Error Handling

**Backend**: Centralized error handler in `middleware/errorHandler.ts`
- Axios errors from LoRaDB are forwarded with original status codes
- Connection errors (ECONNREFUSED, ETIMEDOUT) return 503/504 with descriptive messages
- See `routes/proxy.ts:27-59` for error handling logic

**Frontend**:
- ErrorBoundary component wraps entire app
- API errors displayed via component-level error states
- Token expiry triggers automatic logout

## Testing & Development Notes

- No test suite currently exists (no test scripts in package.json files)
- Use `npm run type-check` to verify TypeScript types without building
- For local development without Docker, run backend and frontend separately (see Development Commands)
- Backend uses morgan for HTTP request logging (dev format in development, combined in production)

## Remote Deployment Considerations

When deploying to a server separate from LoRaDB:
1. Verify network connectivity from UI server to LoRaDB: `curl http://LORADB_IP:8080/health`
2. Ensure JWT_SECRET matches exactly (check with `docker exec loradb env | grep JWT_SECRET`)
3. Open firewall ports 3000 (frontend) and 3001 (backend) on UI server
4. Set VITE_API_URL to UI server's public IP, not localhost
5. Backend connects to LoRaDB via `LORADB_API_URL`, frontend connects to backend via `VITE_API_URL`

## Common Patterns

**Adding a new API endpoint:**
1. Add route handler in `backend/src/routes/proxy.ts` or create new route file
2. Register route in `backend/src/index.ts`
3. Add TypeScript types in `frontend/src/types/api.ts`
4. Add API function in `frontend/src/api/endpoints.ts`
5. Use React Query in component to call endpoint

**Adding a new UI component:**
1. Create component in `frontend/src/components/{Category}/ComponentName.tsx`
2. Add route in `App.tsx` if it's a page
3. Use TanStack Query for server data fetching
4. Use AuthContext's `useAuth()` hook for authentication state

## Dashboard Widgets System

The Dashboard Widgets feature allows users to create customizable, drag-and-drop dashboards for visualizing device measurements in real-time.

### Overview

- **Route**: `/dashboard-widgets`
- **Location**: `frontend/src/components/Dashboard/`
- **Device Types**: `device-types/` folder (mounted as Docker volume)
- **Charts**: ECharts library for gauges and time series
- **Grid**: react-grid-layout for drag/drop functionality
- **Storage**: localStorage (dashboard layouts persisted per browser)

### Widget Types

1. **Current Value** - Large number display with color-coded thresholds
2. **Time Series** - ECharts line chart with optional area fill
3. **Gauge** - Radial gauge with colored zones
4. **Status** - Color-coded status badge with conditions

### Device Type Definitions

Device types define how measurements are extracted and visualized. They are stored as JSON files in the `device-types/` folder, which is mounted as a Docker volume.

**Auto-Discovery**: Device types are automatically loaded from `device-types/index.json`

**Adding a new device type**:
```bash
# 1. Create JSON file in device-types/
cp device-types/dragino-lht65.json device-types/my-sensor.json

# 2. Edit to match your device payload structure
nano device-types/my-sensor.json

# 3. Update the index
./update-device-types.sh

# 4. Restart frontend
docker compose restart frontend
```

**JSON Structure**:
```json
{
  "deviceType": "unique-id",
  "name": "Display Name",
  "manufacturer": "Manufacturer",
  "measurements": [
    {
      "id": "measurement_id",
      "path": "decoded_payload.object.field",  // Dot notation
      "name": "Display Name",
      "unit": "°C",
      "decimals": 1,
      "defaultWidget": "time-series",
      "widgets": {
        "current-value": { "enabled": true, "thresholds": [...] },
        "time-series": { "enabled": true, "color": "#2563eb" },
        "gauge": { "enabled": true, "min": 0, "max": 100, "zones": [...] },
        "status": { "enabled": true, "conditions": [...] }
      }
    }
  ]
}
```

### Key Components

- `DashboardPage.tsx` - Main page with grid and controls
- `DashboardGrid.tsx` - react-grid-layout wrapper
- `WidgetContainer.tsx` - Individual widget wrapper with loading/error states
- `WidgetConfigModal.tsx` - Add/edit widget modal
- `TimeRangeControl.tsx` - Global time range and auto-refresh controls
- `widgets/` - Individual widget type implementations

### Hooks

- `useDeviceTypes()` - Loads device type definitions from index.json
- `useDashboardLayout()` - Manages dashboard state and localStorage persistence
- `useWidgetData()` - Fetches and processes data for individual widgets using React Query

### Data Flow

1. Widget queries LoRaDB: `SELECT uplink FROM device 'DEV_EUI' WHERE LAST '24h'`
2. Response frames processed by `widgetDataProcessor.ts`
3. Measurement value extracted using `getNestedValue()` with dot notation path
4. Data formatted and passed to appropriate widget component
5. Widget renders using ECharts or custom components

### Utilities

- `widgetDataProcessor.ts` - Extracts measurement values from frames using dot notation
- `dashboardStorage.ts` - localStorage helpers for dashboard persistence
- Uses existing `queryParser.ts` `getNestedValue()` function for path extraction

### Docker Volume Mount

The `device-types/` folder is mounted as a read-only volume in docker-compose.yml:
```yaml
volumes:
  - ./device-types:/usr/share/nginx/html/device-types:ro
```

This allows users to add/modify device types without rebuilding the Docker image.

### Adding a New Widget Type

To add a new widget type (e.g., "bar-chart"):
1. Add type to `WidgetType` in `types/widgets.ts`
2. Create widget config interface (e.g., `BarChartWidgetConfig`)
3. Update `MeasurementDefinition` widgets object
4. Create component in `components/Dashboard/widgets/BarChartWidget.tsx`
5. Add case to `WidgetRenderer` in `WidgetContainer.tsx`
6. Update device type JSON files to include new widget config

## Backup & Restore System

The backup system provides comprehensive backup and migration capabilities for all LoRaDB-UI data, including server configurations, dashboard layouts, user settings, and device type definitions.

### Overview

**Features**:
- Manual on-demand backups via Server Management page
- Automatic daily backups at 2 AM (configurable)
- Import with merge or replace strategies
- Automatic cleanup of old backups (7-day retention by default)

**What's Backed Up**:
- Server configurations (name, host, encrypted API keys, password hashes)
- Dashboard layouts and widgets
- User settings
- Device type definitions

### Backup Format

Backups are stored as plain JSON files with the following structure:

```json
{
  "version": "1.0.0",
  "timestamp": "2026-01-03T12:00:00Z",
  "metadata": {
    "type": "full",
    "source": "manual" | "automatic"
  },
  "data": {
    "servers": [...],
    "deviceTypes": [...],
    "dashboards": {...},
    "settings": {...}
  }
}
```

### Environment Configuration

Add to `.env` file (optional - defaults shown):

```bash
BACKUP_ENABLED=true                 # Enable/disable automatic backups
BACKUP_SCHEDULE="0 2 * * *"         # Cron schedule (default: 2 AM daily)
BACKUP_RETENTION_DAYS=7             # Days to keep automatic backups
```

Restart backend to apply changes:
```bash
docker compose restart backend
```

### Usage

#### Manual Backup

1. Navigate to Server Management page (`/servers/manage`)
2. Scroll to "Backup & Restore" section
3. Click "Export Backup" to download current state as JSON file
4. Save the file in a secure location

#### Import Backup

1. Navigate to Server Management page (`/servers/manage`)
2. Click "Import Backup"
3. Select backup JSON file
4. Choose import strategy:
   - **Merge**: Add servers from backup, skip duplicates (recommended)
   - **Replace**: Delete all existing servers, restore from backup (⚠️ destructive)
5. Review preview and confirm

#### Automatic Backups

- Run daily at 2 AM (configurable via `BACKUP_SCHEDULE`)
- Stored in Docker volume at `/app/data/backups/`
- Old backups automatically deleted after 7 days (configurable via `BACKUP_RETENTION_DAYS`)
- Available for download in Server Management page

### Import Strategies

**Merge Strategy** (Recommended):
- Adds new servers from backup
- Skips servers with duplicate names or hosts
- Preserves existing servers
- Conflict resolution: Duplicate names get timestamp suffix
- Safe for regular imports

**Replace Strategy**:
- Deletes ALL existing servers
- Imports servers from backup
- ⚠️ Destructive operation - cannot be undone
- Use only for full system restores

### Security & Important Notes

**API Key Encryption**:
- API keys remain AES-256-GCM encrypted in backups
- Password hashes remain bcrypt hashes
- **You MUST remember server passwords to use restored servers**
- Backups do not contain plaintext passwords or API keys

**Access Control**:
- All backup operations require master password authentication
- Rate limited: 10 operations per 15 minutes per IP
- Backup files stored with 600 permissions (owner read/write only)

**Best Practices**:
1. Store backup files in secure location
2. Test restore process periodically
3. Keep backups encrypted at rest
4. Never commit backup files to version control
5. Document server passwords separately (not in backups)

### Architecture

**Backend** (`backend/src/`):
- `db/repositories/backupRepository.ts` - Backup/restore database operations
- `routes/backup.ts` - API endpoints for backup operations
- `utils/backupScheduler.ts` - Automatic backup scheduler using node-cron
- `utils/deviceTypeLoader.ts` - Device type file operations
- `types/backup.ts` - TypeScript interfaces

**Frontend** (`frontend/src/`):
- `components/Servers/BackupManagement.tsx` - Backup UI component
- `utils/backupUtils.ts` - Client-side backup utilities
- `api/endpoints.ts` - Backup API functions

**API Endpoints**:
```
POST   /api/backup/export           - Export system backup
POST   /api/backup/import           - Import system backup
GET    /api/backup/list             - List automatic backups
GET    /api/backup/download/:file   - Download automatic backup
DELETE /api/backup/:file            - Delete automatic backup
```

### Docker Volume Backup

For complete disaster recovery, back up the Docker volume containing the database and backups:

```bash
# Backup entire Docker volume
docker run --rm -v loradb-ui-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/loradb-data-backup.tar.gz /data

# Restore Docker volume
docker run --rm -v loradb-ui-data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/loradb-data-backup.tar.gz -C /
```

### Troubleshooting

**Automatic backups not running**:
- Check `BACKUP_ENABLED=true` in environment
- Verify `BACKUP_SCHEDULE` is valid cron syntax
- Check backend logs: `docker compose logs backend | grep backup`

**Import fails with "Version Error"**:
- Backup version incompatible with current version
- Upgrade LoRaDB-UI to match backup version

**"Host already exists" errors during merge**:
- Security feature: duplicate hosts skipped to prevent conflicts
- Use replace strategy if intentional override needed
- Or delete conflicting server before import

**Restored servers don't work**:
- API keys are encrypted with original server passwords
- You must remember original passwords to use restored servers
- Re-add server with correct credentials if password forgotten
