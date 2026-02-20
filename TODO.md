# Tempus-Bede Implementation Checklist

> A comprehensive implementation guide for the tempus-bede liturgical calendar API.

---

## Phase 1: Project Setup

- [x] Initialize GitHub repository (Apache 2.0 license)
- [x] Create `.gitignore`
- [x] Create `README.md` scaffold
- [x] Initialize `package.json` with dependencies
  - [x] Hono framework
  - [x] Romcal core + 6 diocese calendars
  - [x] TypeScript
- [x] Configure `tsconfig.json`
- [x] Set up `bunfig.toml`

---

## Phase 2: Core Implementation

### 2.1 Type Definitions (`src/types/index.ts`)

- [ ] Create `DioceseCode` type
  ```typescript
  type DioceseCode = 'united-states' | 'england' | 'france' | 'germany' | 'italy' | 'spain';
  ```
- [ ] Create `Celebration` type
  - [ ] `key: string`
  - [ ] `name: string`
  - [ ] `rank: string`
  - [ ] `rankOrder: number`
  - [ ] `color: string[]`
  - [ ] `season: string`
  - [ ] `isOptionalMemorial: boolean`
  - [ ] `isFeast: boolean`
  - [ ] `isSolemnity: boolean`
- [ ] Create `LiturgicalSeason` type
  - [ ] `name: string`
  - [ ] `key: string`
  - [ ] `week: number`
- [ ] Create `LiturgicalDayResponse` type
  - [ ] `date: string`
  - [ ] `diocese: DioceseCode`
  - [ ] `celebrations: Celebration[]`
  - [ ] `liturgicalSeason: LiturgicalSeason`
- [ ] Create `CalendarQuery` type
  - [ ] `diocese?: DioceseCode`
  - [ ] `locale?: string`
- [ ] Create `ApiError` type
  - [ ] `error: string`
  - [ ] `message: string`
  - [ ] `details?: Record<string, unknown>`
  - [ ] `requestId?: string`
- [ ] Export all types from `index.ts`

### 2.2 Calendar Utilities (`src/utils/calendar.ts`)

- [ ] Create `getSupportedDioceses()` function
  - Returns array of supported diocese codes
- [ ] Create `loadCalendar(diocese: DioceseCode)` function
  - Imports and returns the appropriate romcal calendar
  - Uses dynamic imports or static map
- [ ] Create `getRomcalInstance(diocese: DioceseCode)` function
  - Creates configured Romcal instance
  - Sets `calculateProperties: true`
- [ ] Create `getLiturgicalDay(date: Date, diocese: DioceseCode)` function
  - Generates calendar for the year
  - Extracts celebrations for the specific date
  - Formats response according to `LiturgicalDayResponse`
- [ ] Create `getToday(diocese: DioceseCode)` function
  - Wrapper around `getLiturgicalDay` with current date

### 2.3 Date Utilities (`src/utils/date.ts`)

- [ ] Create `validateDateFormat(dateString: string)` function
  - Regex validation for YYYY-MM-DD format
- [ ] Create `parseDate(dateString: string)` function
  - Parses and validates a date string
  - Returns `Date` object or throws error
- [ ] Create `formatDate(date: Date)` function
  - Returns date in YYYY-MM-DD format
- [ ] Create `isValidDate(date: Date)` function
  - Checks if date is valid (not NaN)
- [ ] Create `isWithinRomcalRange(date: Date)` function
  - Checks if date is within romcal's supported range

### 2.4 Response Builder (`src/utils/response-builder.ts`)

- [ ] Create `buildCelebrationResponse(data, date, diocese)` function
  - Transforms romcal output to API response format
  - Handles multiple celebrations per day
  - Extracts liturgical season info
- [ ] Create `buildErrorResponse(code, message, details?)` function
  - Standardizes error response format

### 2.5 Error Classes (`src/utils/errors.ts`)

- [ ] Create `ApiError` base class
  - `code: string`
  - `statusCode: number`
  - `details?: Record<string, unknown>`
- [ ] Create `ValidationError` class (extends `ApiError`)
- [ ] Create `UnsupportedDioceseError` class
  - Accepts provided diocese and list of supported
- [ ] Create `InvalidDateFormatError` class
  - Accepts provided format and expected format
- [ ] Create `InvalidDateError` class
  - Accepts date string and reason

### 2.6 Middleware (`src/middleware/`)

- [ ] Create `error-handler.ts`
  - Global error handling middleware
  - Differentiates between API errors and unexpected errors
  - Logs errors with request context
  - Returns appropriate JSON error responses
- [ ] Create `logger.ts`
  - Request logging middleware
  - Logs method, path, status, duration
  - Generates request IDs

### 2.7 API Routes (`src/routes/`)

#### `/today` Route (`src/routes/today.ts`)
- [ ] Create GET handler
- [ ] Parse `diocese` query parameter (default: `united-states`)
- [ ] Parse `locale` query parameter (default: `en`)
- [ ] Validate diocese is supported
- [ ] Call `getToday()` utility
- [ ] Return JSON response
- [ ] Handle errors appropriately

#### `/date/:date` Route (`src/routes/date.ts`)
- [ ] Create GET handler
- [ ] Parse `date` path parameter
- [ ] Validate date format (YYYY-MM-DD)
- [ ] Validate date is a real date
- [ ] Parse `diocese` query parameter
- [ ] Call `getLiturgicalDay()` utility
- [ ] Return JSON response
- [ ] Handle errors appropriately

#### Health Check Route (`src/routes/health.ts`)
- [ ] Create GET `/health` handler
- [ ] Return `{ status: "ok", timestamp: string }`
- [ ] Used for Docker health checks

#### Route Aggregator (`src/routes/index.ts`)
- [ ] Import all route modules
- [ ] Create Hono instance for routes
- [ ] Mount all route handlers
- [ ] Export combined router

### 2.8 App Configuration (`src/app.ts`)

- [ ] Import Hono
- [ ] Import middleware (logger, cors, error-handler)
- [ ] Import routes
- [ ] Create Hono app instance
- [ ] Apply `logger()` middleware
- [ ] Apply `cors()` middleware
- [ ] Register routes
- [ ] Set up global error handler
- [ ] Export app

### 2.9 Entry Point (`src/index.ts`)

- [ ] Import app from `./app`
- [ ] Get port from environment variable (default: 3000)
- [ ] Create `Bun.serve()` with app.fetch
- [ ] Log startup message

---

## Phase 3: Docker & Deployment

### 3.1 Docker Configuration

- [ ] Create `Dockerfile`
  - [ ] Use multi-stage build
  - [ ] Stage 1: Build with `oven/bun:1-alpine`
  - [ ] Stage 2: Production runner
  - [ ] Create non-root user
  - [ ] Copy built files and node_modules
  - [ ] Set proper permissions
  - [ ] Add HEALTHCHECK
- [ ] Create `.dockerignore`
  - [ ] Ignore `node_modules`
  - [ ] Ignore `.git`
  - [ ] Ignore test files
  - [ ] Ignore documentation
- [ ] Create `docker-compose.yml`
  - [ ] Define api service
  - [ ] Map port 3000
  - [ ] Set environment variables
  - [ ] Configure health check
  - [ ] Set restart policy

### 3.2 Production Readiness

- [ ] Add health check endpoint (`/health`)
- [ ] Configure environment variables
  - [ ] `PORT`
  - [ ] `NODE_ENV`
- [ ] Add graceful shutdown handling
- [ ] Configure logging levels

---

## Phase 4: Testing

### 4.1 Unit Tests

#### Date Utilities (`tests/utils/date.test.ts`)
- [ ] Test `validateDateFormat()` with valid formats
- [ ] Test `validateDateFormat()` with invalid formats
- [ ] Test `parseDate()` with valid dates
- [ ] Test `parseDate()` with invalid dates
- [ ] Test `formatDate()` output format
- [ ] Test `isValidDate()` edge cases
- [ ] Test `isWithinRomcalRange()` boundaries

#### Calendar Utilities (`tests/utils/calendar.test.ts`)
- [ ] Test `getSupportedDioceses()` returns expected list
- [ ] Test `loadCalendar()` for each diocese
- [ ] Test `getRomcalInstance()` configuration
- [ ] Test `getLiturgicalDay()` with known dates
- [ ] Test `getToday()` returns current date

#### Response Builder (`tests/utils/response-builder.test.ts`)
- [ ] Test `buildCelebrationResponse()` format
- [ ] Test `buildErrorResponse()` format

#### Error Classes (`tests/utils/errors.test.ts`)
- [ ] Test each error class instantiation
- [ ] Test error properties are set correctly

### 4.2 API Route Tests

#### Today Route (`tests/routes/today.test.ts`)
- [ ] Test GET `/today` returns 200
- [ ] Test response has required fields
- [ ] Test default diocese is `united-states`
- [ ] Test custom diocese parameter
- [ ] Test invalid diocese returns 400
- [ ] Test all 6 supported dioceses

#### Date Route (`tests/routes/date.test.ts`)
- [ ] Test GET `/date/:date` with valid date
- [ ] Test with YYYY-MM-DD format
- [ ] Test invalid date format returns 400
- [ ] Test non-existent date (e.g., 2026-02-30) returns 400
- [ ] Test diocese parameter works
- [ ] Test all 6 supported dioceses

#### Health Route (`tests/routes/health.test.ts`)
- [ ] Test GET `/health` returns 200
- [ ] Test response has status: "ok"

### 4.3 Integration Tests (`tests/integration/api.test.ts`)

- [ ] Test full request/response cycle
- [ ] Test CORS headers
- [ ] Test error response format
- [ ] Test concurrent requests
- [ ] Test known feast days (e.g., Christmas, Easter calculation)

### 4.4 Multi-Diocese Support Tests

- [ ] Test each diocese returns proper celebrations
- [ ] Test diocese-specific feast days differ
- [ ] Test fallback to General Roman Calendar

---

## Phase 5: Documentation

### 5.1 README.md Updates

- [ ] Add project description and purpose
- [ ] Add quick start guide
  - [ ] Prerequisites (Bun)
  - [ ] Installation
  - [ ] Running locally
- [ ] Add API documentation
  - [ ] `GET /today` endpoint
  - [ ] `GET /date/:date` endpoint
  - [ ] Query parameters
  - [ ] Response schema
  - [ ] Error codes
- [ ] Add API examples with curl
- [ ] Add supported dioceses list
- [ ] Add development guide
  - [ ] Running tests
  - [ ] Type checking
  - [ ] Building for production
- [ ] Add Docker instructions
- [ ] Add contribution guidelines

### 5.2 Code Documentation

- [ ] Add JSDoc comments to all public functions
- [ ] Document type definitions
- [ ] Add inline comments for complex logic

---

## Phase 6: Polish & Release

### 6.1 Code Quality

- [ ] Run TypeScript compiler with no errors (`bunx tsc --noEmit`)
- [ ] Ensure all tests pass (`bun test`)
- [ ] Add Biome for linting (optional)
- [ ] Format code consistently

### 6.2 Pre-Release Checklist

- [ ] Verify all Phase 2 items complete
- [ ] Verify all Phase 3 items complete
- [ ] Verify all Phase 4 items complete
- [ ] Verify all Phase 5 items complete
- [ ] Test Docker build locally
- [ ] Test Docker container runs correctly
- [ ] Verify health check works
- [ ] Update version in package.json

### 6.3 Release

- [ ] Create git tag `v0.1.0`
- [ ] Create GitHub release with notes
- [ ] Publish Docker image (optional)

---

## Future Enhancements (Post-MVP)

### Additional Endpoints

- [ ] `GET /calendar/:year` - Full year calendar
- [ ] `GET /search` - Search celebrations by name
- [ ] `GET /saints/:key` - Saint details
- [ ] `GET /seasons/:season` - Season information

### Performance

- [ ] Add Redis caching layer
  - [ ] Cache full year calendars
  - [ ] Cache individual day lookups
  - [ ] TTL-based invalidation
- [ ] Pre-compute calendars on startup

### Security & Operations

- [ ] Add rate limiting
  - [ ] Use Hono rate limiter middleware
  - [ ] Configure limits per endpoint
- [ ] Add API key authentication (optional)
- [ ] Add request ID tracing
- [ ] Add structured JSON logging
- [ ] Add metrics/monitoring endpoint

### Documentation

- [ ] Generate OpenAPI/Swagger documentation
- [ ] Create Postman collection
- [ ] Add API playground/OpenAPI UI

### Additional Dioceses

Priority list for expansion:
- [ ] Poland (`@romcal/calendar.poland`)
- [ ] Philippines (`@romcal/calendar.philippines`)
- [ ] Mexico (`@romcal/calendar.mexico`)
- [ ] Brazil (`@romcal/calendar.brazil`)
- [ ] Ireland (`@romcal/calendar.ireland`)

### Localization

- [ ] Support multiple languages for celebration names
- [ ] `es` (Spanish)
- [ ] `fr` (French)
- [ ] `de` (German)
- [ ] `it` (Italian)
- [ ] `la` (Latin)

---

## Progress Summary

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: Project Setup | Complete | 100% |
| Phase 2: Core Implementation | Not Started | 0% |
| Phase 3: Docker & Deployment | Not Started | 0% |
| Phase 4: Testing | Not Started | 0% |
| Phase 5: Documentation | Not Started | 0% |
| Phase 6: Polish & Release | Not Started | 0% |

**Overall Progress: ~16% (Phase 1 Complete)**

---

## Notes

- Uses Bun runtime for optimal performance
- Hono framework for lightweight HTTP handling
- Romcal for accurate liturgical calendar computation
- 6 diocese calendars pre-installed
- Docker-first deployment strategy
- Target: v0.1.0 MVP release

---

*Last updated: 2026-02-21*