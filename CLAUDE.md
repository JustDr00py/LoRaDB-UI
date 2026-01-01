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
