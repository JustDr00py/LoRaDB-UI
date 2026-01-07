# Security Audit Report - LoRaDB-UI
**Date:** January 6, 2026
**Scope:** NPM vulnerabilities, Rate limiting, Input sanitization, Authentication

## 1. NPM Vulnerability Summary

### Backend (High Priority - 4 High Severity)
```
✗ jws <3.2.3 - HIGH SEVERITY
  Issue: HMAC Signature verification flaw
  CVE: GHSA-869p-cjfg-cm3x
  Impact: Authentication bypass potential
  Fix: Run `npm audit fix`

✗ qs <6.14.1 - HIGH SEVERITY  
  Issue: DoS via memory exhaustion (arrayLimit bypass)
  CVE: GHSA-6rw7-vpxm-498p
  Impact: Denial of Service
  Affected: body-parser, express
  Fix: Run `npm audit fix`
```

### Frontend (Moderate Priority - 2 Moderate Severity)
```
✗ esbuild <=0.24.2 - MODERATE SEVERITY
  Issue: Development server request smuggling
  CVE: GHSA-67mh-4wv8-2f99
  Impact: Development environment only
  Affected: vite
  Fix: Requires vite upgrade (breaking change)
  Note: Production builds unaffected
```

## 2. Rate Limiting Analysis ✅ GOOD

**Implementation:** express-rate-limit properly configured

### Coverage:
- ✅ General API: 100 req/15min per IP
- ✅ Authentication: 10 req/15min per IP (strict)
- ✅ Master Password: 5 req/15min per IP (very strict)
- ✅ Server Creation: 10 req/hour per IP
- ✅ Server Deletion: 20 req/15min per IP
- ✅ Backup Operations: 10 req/15min per IP

**Location:** `backend/src/middleware/rateLimiter.ts`

### Recommendations:
- ✅ skipSuccessfulRequests enabled for auth endpoints
- ✅ standardHeaders enabled (RFC compliance)
- ✅ IP-based limiting (considers X-Forwarded-For)

## 3. Input Sanitization Analysis

### ✅ GOOD - SQL Injection Protection
- Uses better-sqlite3 with prepared statements
- All queries use parameterized statements (?)
- Example: `db.prepare('SELECT * FROM servers WHERE id = ?').get(id)`
- **Status:** PROTECTED

### ✅ GOOD - Server Input Validation
**File:** `backend/src/routes/servers.ts`
- Server name: Regex validation `^[a-zA-Z0-9\s\-_]+$`
- Host format: URL parsing + IP:port regex validation
- Password: Length + complexity requirements (8-72 chars)
- API key: Required field validation

### ✅ GOOD - Authentication
- JWT with HS256 algorithm
- bcrypt password hashing
- AES-256-GCM API key encryption
- Token expiration enforced

### ⚠️ MODERATE - Master Password Storage
**File:** `backend/src/routes/auth.ts:135`
```javascript
const isValid = password === config.masterPassword;
```
- Master password stored in plaintext in environment
- Simple string comparison (no timing-safe compare)
- Documented in CLAUDE.md as a known limitation

**Recommendation:** 
- Use crypto.timingSafeEqual() to prevent timing attacks
- Consider bcrypt hashing for master password

### ⚠️ POTENTIAL ISSUE - Path Traversal in Backup
**File:** `backend/src/routes/backup.ts`
- Backup file downloads via filename parameter
- Need to verify path sanitization in backupRepository

### ✅ GOOD - Proxy Route Protection
**File:** `backend/src/routes/proxy.ts:82-88`
- All requests proxied through req.loradbClient
- Server context middleware validates authentication
- Query bodies passed directly to LoRaDB (trusted backend)
- No user input in URL construction

### ⚠️ CHECK - Device EUI Parameter
**File:** `backend/src/routes/proxy.ts:108-111`
```javascript
const { dev_eui } = req.params;
const response = await req.loradbClient!.get(`/devices/${dev_eui}`);
```
**Concern:** dev_eui not validated before URL construction
**Recommendation:** Add regex validation for DevEUI format (hex string)

## 4. XSS Protection Analysis

### Frontend
- React automatically escapes rendered content
- No dangerouslySetInnerHTML found
- No eval() usage found
- **Status:** PROTECTED by React defaults

### Backend
- JSON responses only (Content-Type: application/json)
- No HTML rendering
- **Status:** Not applicable

## 5. Authentication & Authorization

### ✅ Session Management
- JWT with server context (server_id claim)
- Token expiration enforced
- Server existence validated on token verification
- localStorage with expiration tracking

### ✅ Master Auth Middleware
**File:** `backend/src/middleware/masterAuth.ts`
- Protects /servers/manage routes
- JWT type validation (type='master')
- Optional (backward compatible)

### Potential Issues:
1. No CSRF protection (API-only, stateless JWT)
   - Acceptable for SPA architecture
   - CORS properly configured

2. No request signing
   - Acceptable for internal tool

## 6. Dependency Versions

### Backend (needs updates)
```json
"express": "^4.18.2"      → Vulnerable (qs dependency)
"jsonwebtoken": "^9.0.2"  → OK
"bcrypt": "^5.1.1"        → OK
"axios": "^1.6.5"         → OK
```

### Frontend
```json
"vite": "^5.0.11"         → Moderate vulnerability (dev only)
"axios": "^1.13.2"        → Check for updates
"react": "^18.2.0"        → OK
```

## 7. Priority Recommendations

### CRITICAL (Do Immediately)
1. **Update backend dependencies**
   ```bash
   cd backend
   npm audit fix
   npm test  # Verify no breaking changes
   ```

### HIGH (Do Soon)
2. **Add DevEUI validation**
   ```typescript
   // backend/src/routes/proxy.ts:108
   if (!/^[0-9A-Fa-f]{16}$/.test(dev_eui)) {
     return res.status(400).json({ error: 'Invalid DevEUI format' });
   }
   ```

3. **Timing-safe password comparison**
   ```typescript
   // backend/src/routes/auth.ts:135
   import crypto from 'crypto';
   const isValid = crypto.timingSafeEqual(
     Buffer.from(password), 
     Buffer.from(config.masterPassword)
   );
   ```

4. **Verify backup path sanitization**
   - Review backupRepository.downloadBackup()
   - Ensure no path traversal (../)

### MEDIUM (Consider)
5. **Update frontend vite** (breaking change)
   - Only affects development server
   - Test thoroughly before upgrading

6. **Add request body size limits**
   ```typescript
   // backend/src/index.ts
   app.use(express.json({ limit: '10mb' }));
   ```

7. **Add helmet.js for security headers**
   ```bash
   npm install helmet
   ```

### LOW (Nice to Have)
8. Consider HTTPS enforcement in production
9. Add security.txt file
10. Implement CSP headers (frontend nginx)

## 8. Security Score: 7.5/10

**Strengths:**
- ✅ Comprehensive rate limiting
- ✅ Parameterized SQL queries
- ✅ Proper password hashing (bcrypt)
- ✅ API key encryption (AES-256-GCM)
- ✅ Input validation on critical fields
- ✅ React XSS protection

**Weaknesses:**
- ❌ Vulnerable npm dependencies (backend)
- ⚠️ Plaintext master password storage
- ⚠️ Missing DevEUI validation
- ⚠️ No timing-safe comparison

**Overall:** Good security posture with immediate attention needed for dependency updates.
