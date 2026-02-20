# Tempus-Bede Architecture Design Document

## 1. Overview

### Purpose
Tempus-Bede is a lightweight, high-performance liturgical calendar API that provides Catholic liturgical calendar data for various dioceses worldwide. Named after the Venerable Bede, the 8th-century English monk and chronicler, this service delivers accurate liturgical information including feast days, celebrations, and liturgical seasons.

### Core Value Proposition
- **Simplicity**: Clean, RESTful API with predictable endpoints
- **Accuracy**: Powered by romcal, a well-maintained liturgical calendar library
- **Multinational Support**: Built-in support for 6 dioceses across major Catholic regions
- **Performance**: Bun runtime with minimal overhead for fast response times
- **Container-Ready**: Docker-first deployment strategy

### Target Users
- Catholic parishes and dioceses needing calendar integration
- Liturgical app developers building prayer/meditation applications
- Religious education platforms requiring feast day information
- Church management software integrators

---

## 2. Technology Stack

### Runtime: Bun
**Rationale**: Bun provides significant performance advantages over Node.js:
- Native TypeScript support without transpilation
- Built-in test runner (no Jest/Vitest needed)
- Fast startup times (~4x faster than Node.js)
- Integrated package manager with workspace support
- Native Web API implementations (fetch, Request, Response)

### Framework: Hono
**Rationale**: Hono is a modern, lightweight web framework:
- Ultra-small bundle size (~14KB)
- Zero dependencies
- TypeScript-first design
- Multi-runtime support (Bun, Deno, Node.js, Cloudflare Workers)
- Intuitive routing API
- Built-in middleware ecosystem

### Calendar Engine: romcal
**Rationale**: romcal is the gold standard for liturgical calendar computation:
- Accurate implementation of the General Roman Calendar
- Diocese-specific calendar support via plugins
- Active maintenance and community
- Comprehensive celebration data (colors, ranks, seasons)
- Supports the 1969 reform of the liturgical calendar

### Containerization: Docker
**Rationale**: Docker provides consistent deployment:
- Multi-stage builds for minimal image size
- Reproducible production environments
- Easy horizontal scaling
- Standard deployment target for cloud platforms

### Supported Dioceses
| Package | Region |
|---------|--------|
| `@romcal/calendar.united-states` | United States Conference of Catholic Bishops (USCCB) |
| `@romcal/calendar.england` | England and Wales |
| `@romcal/calendar.france` | France |
| `@romcal/calendar.germany` | Germany |
| `@romcal/calendar.italy` | Italy |
| `@romcal/calendar.spain` | Spain |

---

## 3. API Design

### Base URL
```
https://api.tempus-bede.io/v1
```

### Endpoints

#### GET /today
Returns the liturgical celebration for the current date.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `diocese` | string | No | `united-states` | The diocese calendar to use |
| `locale` | string | No | `en` | Language for celebration names |

**Response Schema:**
```json
{
  "date": "2026-02-21",
  "diocese": "united-states",
  "celebrations": [
    {
      "key": "saint_peter_damiani_bishop_doctor",
      "name": "Saint Peter Damian, Bishop and Doctor of the Church",
      "rank": "memorial",
      "rankOrder": 3,
      "color": ["white"],
      "season": "ordinary_time",
      "isOptionalMemorial": false,
      "isFeast": false,
      "isSolemnity": false
    }
  ],
  "liturgicalSeason": {
    "name": "Ordinary Time",
    "key": "ordinary_time",
    "week": 7
  }
}
```

#### GET /date/:date
Returns the liturgical celebration for a specific date.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | string | Date in YYYY-MM-DD format |

**Query Parameters:**
Same as `/today`

**Response Schema:**
Same as `/today`

**Example:**
```
GET /date/2026-12-25?diocese=england
```

### Query Parameters Detail

#### diocese
Supported values:
- `united-states` (default)
- `england`
- `france`
- `germany`
- `italy`
- `spain`

#### locale
Currently supported: `en` (English)
Future support planned for: `es`, `fr`, `de`, `it`, `la` (Latin)

### Error Responses

#### 400 Bad Request - Invalid Date Format
```json
{
  "error": "INVALID_DATE_FORMAT",
  "message": "Date must be in YYYY-MM-DD format",
  "details": {
    "provided": "Feb-21-2026",
    "expected": "2026-02-21"
  }
}
```

#### 400 Bad Request - Invalid Date Value
```json
{
  "error": "INVALID_DATE",
  "message": "The provided date is not valid",
  "details": {
    "provided": "2026-02-30",
    "reason": "February does not have 30 days"
  }
}
```

#### 400 Bad Request - Unsupported Diocese
```json
{
  "error": "UNSUPPORTED_DIOCESE",
  "message": "The requested diocese calendar is not available",
  "details": {
    "provided": "mexico",
    "supported": ["united-states", "england", "france", "germany", "italy", "spain"]
  }
}
```

#### 500 Internal Server Error
```json
{
  "error": "INTERNAL_ERROR",
  "message": "An unexpected error occurred",
  "requestId": "req_abc123"
}
```

### Future Endpoints (Planned)

#### GET /calendar/:year
Returns all celebrations for a liturgical year.

#### GET /search
Search for celebrations by name or attribute.

#### GET /saints/:key
Detailed information about a specific saint/celebration.

#### GET /seasons/:season
Liturgical season information and dates.

---

## 4. Data Flow

### Request Flow Diagram

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────────────────────────────────────────────┐
│                    Hono Router                       │
│  ┌───────────┐  ┌────────────┐  ┌────────────────┐  │
│  │  Params   │  │  Queries   │  │   Middleware   │  │
│  └───────────┘  └────────────┘  └────────────────┘  │
└─────────────────────────┬───────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│              Validation Layer                        │
│  ┌───────────────┐  ┌────────────────────────────┐  │
│  │ Date Format   │  │    Diocese Check           │  │
│  │ Validation    │  │    (against supported)     │  │
│  └───────────────┘  └────────────────────────────┘  │
└─────────────────────────┬───────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│              Romcal Service                          │
│  ┌───────────────────────────────────────────────┐  │
│  │  new Romcal({                                 │  │
│  │    localizedCalendar: dioceseCalendar,        │  │
│  │    outputOptions: {                           │  │
│  │      calculateProperties: true                │  │
│  │    }                                          │  │
│  │  }).generateCalendar(year)                    │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│              Response Builder                        │
│  ┌───────────────┐  ┌────────────────────────────┐  │
│  │  Extract      │  │    Format JSON             │  │
│  │  Celebration  │  │    Response                │  │
│  └───────────────┘  └────────────────────────────┘  │
└─────────────────────────┬───────────────────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │   JSON      │
                   │   Response  │
                   └─────────────┘
```

### Caching Strategy

#### Current Implementation
No caching layer (stateless). Each request computes the calendar fresh.

#### Planned Implementation
```
┌─────────────────────────────────────────────┐
│              Cache Layers                     │
├─────────────────────────────────────────────┤
│  L1: In-Memory (Bun.serve response cache)    │
│      - TTL: 24 hours                         │
│      - Size: 365 entries per diocese         │
├─────────────────────────────────────────────┤
│  L2: Redis (distributed cache)               │
│      - TTL: 7 days                           │
│      - Shared across instances               │
├─────────────────────────────────────────────┤
│  L3: Computed (romcal generation)            │
│      - Only on cache miss                    │
└─────────────────────────────────────────────┘
```

### Date Validation Flow

```
Input Date String
       │
       ▼
┌──────────────────┐
│ Regex Match?     │──No──▶ 400 INVALID_DATE_FORMAT
│ YYYY-MM-DD       │
└────────┬─────────┘
         │ Yes
         ▼
┌──────────────────┐
│ Parse with       │
│ Date constructor │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Valid Date?      │──No──▶ 400 INVALID_DATE
│ (!isNaN)         │
└────────┬─────────┘
         │ Yes
         ▼
┌──────────────────┐
│ Within Range?    │──No──▶ 400 DATE_OUT_OF_RANGE
│ (romcal limits)  │
└────────┬─────────┘
         │ Yes
         ▼
   Valid Date
```

---

## 5. Diocese System

### Architecture

The diocese system uses a plugin architecture where each diocese calendar is a separate npm package:

```
@romcal/calendar.<diocese>
         │
         ▼
┌─────────────────────────────────┐
│  Diocese Calendar Package        │
│  - Local feast days              │
│  - Regional observances          │
│  - Proper celebrations           │
│  - Calendar-specific rules       │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  romcal Core                     │
│  - General Roman Calendar        │
│  - Liturgical rules              │
│  - Date calculations             │
└─────────────────────────────────┘
```

### Plugin Loading Pattern

```typescript
// src/utils/diocese-loader.ts
import { Romcal } from 'romcal';
import unitedStates from '@romcal/calendar.united-states';
import england from '@romcal/calendar.england';
import france from '@romcal/calendar.france';
import germany from '@romcal/calendar.germany';
import italy from '@romcal/calendar.italy';
import spain from '@romcal/calendar.spain';

type DioceseKey = 'united-states' | 'england' | 'france' | 'germany' | 'italy' | 'spain';

const dioceseCalendars: Record<DioceseKey, any> = {
  'united-states': unitedStates,
  'england': england,
  'france': france,
  'germany': germany,
  'italy': italy,
  'spain': spain,
};

export function getRomcal(diocese: DioceseKey): Romcal {
  const localizedCalendar = dioceseCalendars[diocese];
  
  return new Romcal({
    localizedCalendar,
    outputOptions: {
      calculateProperties: true,
    },
  });
}

export function isValidDiocese(diocese: string): diocese is DioceseKey {
  return diocese in dioceseCalendars;
}

export function listDioceses(): DioceseKey[] {
  return Object.keys(dioceseCalendars) as DioceseKey[];
}
```

### Adding New Dioceses

To add support for a new diocese:

1. **Install the romcal calendar package:**
   ```bash
   bun add @romcal/calendar.mexico
   ```

2. **Update the diocese loader:**
   ```typescript
   import mexico from '@romcal/calendar.mexico';
   
   type DioceseKey = '...' | 'mexico';
   
   const dioceseCalendars = {
     // ... existing
     'mexico': mexico,
   };
   ```

3. **Update documentation and validation messages.**

4. **Run tests to verify integration.**

### Diocese Calendar Differences

Each diocese calendar may differ in:
- **Regional Patron Saints**: E.g., St. Patrick in Ireland (not in our set, but illustrative)
- **National Observances**: Thanksgiving Day in the United States
- **Local Feasts**: Specific to the bishops' conference
- **Calendar Transfers**: When celebrations conflict with Sundays

---

## 6. Project Structure

```
tempus-bede/
├── src/
│   ├── index.ts              # Entry point, starts server
│   ├── app.ts                # Hono app configuration
│   │
│   ├── routes/
│   │   ├── index.ts          # Route aggregator
│   │   ├── today.ts          # GET /today handler
│   │   └── date.ts           # GET /date/:date handler
│   │
│   ├── services/
│   │   └── romcal-service.ts # Romcal wrapper & caching
│   │
│   ├── utils/
│   │   ├── diocese-loader.ts # Diocese calendar loading
│   │   ├── date-validator.ts # Date validation helpers
│   │   └── response-builder.ts # Response formatting
│   │
│   ├── types/
│   │   ├── index.ts          # Type exports
│   │   ├── celebration.ts    # Celebration type definitions
│   │   └── api.ts            # API request/response types
│   │
│   └── middleware/
│       ├── error-handler.ts  # Global error handling
│       └── logger.ts         # Request logging
│
├── tests/
│   ├── routes/
│   │   ├── today.test.ts
│   │   └── date.test.ts
│   ├── utils/
│   │   └── date-validator.test.ts
│   └── integration/
│       └── api.test.ts
│
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── README.md
├── ARCHITECTURE.md
└── CLAUDE.md
```

### Key Files

#### src/index.ts
```typescript
import app from './app';

const port = process.env.PORT || 3000;

Bun.serve({
  fetch: app.fetch,
  port,
});

console.log(`🚀 Tempus-Bede API running on http://localhost:${port}`);
```

#### src/app.ts
```typescript
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import routes from './routes';
import { errorHandler } from './middleware/error-handler';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.route('/', routes);
app.onError(errorHandler);

export default app;
```

#### src/routes/today.ts
```typescript
import { Hono } from 'hono';
import { getRomcal, isValidDiocese } from '../utils/diocese-loader';
import { buildCelebrationResponse } from '../utils/response-builder';

const today = new Hono();

today.get('/', (c) => {
  const diocese = c.req.query('diocese') || 'united-states';
  
  if (!isValidDiocese(diocese)) {
    return c.json({
      error: 'UNSUPPORTED_DIOCESE',
      // ... error details
    }, 400);
  }
  
  const romcal = getRomcal(diocese);
  const today = new Date();
  const year = romcal.generateCalendar(today.getFullYear());
  
  const celebration = year[formatDate(today)];
  
  return c.json(buildCelebrationResponse(celebration, today, diocese));
});

export default today;
```

---

## 7. Error Handling

### Error Types

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `INVALID_DATE_FORMAT` | 400 | Date string doesn't match YYYY-MM-DD |
| `INVALID_DATE` | 400 | Date string is not a valid date |
| `DATE_OUT_OF_RANGE` | 400 | Date outside romcal's supported range |
| `UNSUPPORTED_DIOCESE` | 400 | Requested diocese not installed |
| `MISSING_PARAMETER` | 400 | Required parameter not provided |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Error Handler Implementation

```typescript
// src/middleware/error-handler.ts
import { Context } from 'hono';

interface ApiError extends Error {
  code: string;
  statusCode: number;
  details?: Record<string, any>;
}

export function errorHandler(err: Error, c: Context) {
  console.error('Error:', err);
  
  if (isApiError(err)) {
    return c.json({
      error: err.code,
      message: err.message,
      details: err.details,
      requestId: c.get('requestId'),
    }, err.statusCode);
  }
  
  return c.json({
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    requestId: c.get('requestId'),
  }, 500);
}

function isApiError(err: Error): err is ApiError {
  return 'code' in err && 'statusCode' in err;
}
```

### Custom Error Classes

```typescript
// src/utils/errors.ts
export class ValidationError extends Error {
  code = 'VALIDATION_ERROR';
  statusCode = 400;
  
  constructor(message: string, public details?: Record<string, any>) {
    super(message);
  }
}

export class UnsupportedDioceseError extends Error {
  code = 'UNSUPPORTED_DIOCESE';
  statusCode = 400;
  
  constructor(diocese: string, supported: string[]) {
    super(`Diocese '${diocese}' is not supported`);
    this.details = { provided: diocese, supported };
  }
}

export class InvalidDateError extends Error {
  code = 'INVALID_DATE';
  statusCode = 400;
  
  constructor(date: string, reason: string) {
    super(`Invalid date: ${date}`);
    this.details = { provided: date, reason };
  }
}
```

---

## 8. Docker Deployment

### Multi-Stage Dockerfile

```dockerfile
# Stage 1: Build
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Copy source
COPY . .

# Build
RUN bun build src/index.ts --outdir ./dist --target=bun

# Stage 2: Production
FROM oven/bun:1-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S tempus_bede -u 1001

# Copy built files
COPY --from=builder --chown=tempus_bede:nodejs /app/dist ./dist
COPY --from=builder --chown=tempus_bede:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=tempus_bede:nodejs /app/package.json ./

USER tempus_bede

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["bun", "run", "dist/index.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

### Production Considerations

#### Resource Limits
```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 256M
    reservations:
      cpus: '0.1'
      memory: 64M
```

#### Logging
- Structured JSON logging
- Log levels: `error`, `warn`, `info`, `debug`
- Request ID tracking for distributed tracing

#### Scaling
- Horizontal scaling via multiple containers
- Load balancer (nginx, Traefik, or cloud LB)
- Shared cache layer (Redis) for multi-instance deployments

#### Security
- HTTPS termination at load balancer level
- Rate limiting to prevent abuse
- Input validation on all parameters
- No SQL injection risk (no database)

---

## 9. Future Expansion

### Planned Features

#### GET /calendar/:year
Generate complete liturgical calendar for a year.

**Response:**
```json
{
  "year": 2026,
  "diocese": "united-states",
  "calendar": {
    "2026-01-01": { /* celebrations */ },
    "2026-01-02": { /* celebrations */ },
    // ... all 365 days
  }
}
```

#### Caching Layer
- Redis for distributed caching
- Pre-compute annual calendars at startup
- TTL-based invalidation

#### Rate Limiting
```typescript
import { rateLimiter } from 'hono/rate-limiter';

app.use('*', rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
}));
```

#### OpenAPI Documentation
```yaml
openapi: 3.0.0
info:
  title: Tempus-Bede API
  version: 1.0.0
paths:
  /today:
    get:
      summary: Get today's liturgical celebration
      parameters:
        - name: diocese
          in: query
          schema:
            type: string
            enum: [united-states, england, france, germany, italy, spain]
```

#### Additional Dioceses
Priority list for expansion:
1. Poland (`@romcal/calendar.poland`)
2. Philippines (`@romcal/calendar.philippines`)
3. Mexico (`@romcal/calendar.mexico`)
4. Brazil (`@romcal/calendar.brazil`)
5. Ireland (`@romcal/calendar.ireland`)

#### GraphQL Endpoint
Alternative query interface for complex queries.

---

## 10. Development Workflow

### Local Development

```bash
# Install dependencies
bun install

# Start development server with hot reload
bun run dev

# Run tests
bun test

# Run tests in watch mode
bun test --watch

# Type checking
bunx tsc --noEmit

# Build for production
bun run build
```

### Testing Strategy

#### Unit Tests
- Test individual utility functions
- Mock romcal for deterministic tests
- Coverage target: 80%

```typescript
// tests/utils/date-validator.test.ts
import { test, expect, describe } from 'bun:test';
import { validateDate, formatDate } from '../../src/utils/date-validator';

describe('validateDate', () => {
  test('accepts valid YYYY-MM-DD format', () => {
    expect(validateDate('2026-02-21')).toBe(true);
  });
  
  test('rejects invalid formats', () => {
    expect(validateDate('02-21-2026')).toBe(false);
    expect(validateDate('Feb 21, 2026')).toBe(false);
  });
  
  test('rejects invalid dates', () => {
    expect(validateDate('2026-02-30')).toBe(false);
    expect(validateDate('2026-13-01')).toBe(false);
  });
});
```

#### Integration Tests
- Full API request/response tests
- Test all supported dioceses
- Error scenario coverage

```typescript
// tests/integration/api.test.ts
import { test, expect, describe } from 'bun:test';
import app from '../../src/app';

describe('API Integration', () => {
  test('GET /today returns valid response', async () => {
    const res = await app.request('/today');
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data).toHaveProperty('date');
    expect(data).toHaveProperty('celebrations');
    expect(Array.isArray(data.celebrations)).toBe(true);
  });
  
  test('GET /today with diocese parameter', async () => {
    const res = await app.request('/today?diocese=england');
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.diocese).toBe('england');
  });
  
  test('GET /date/:date with invalid date returns 400', async () => {
    const res = await app.request('/date/invalid');
    expect(res.status).toBe(400);
  });
});
```

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: oven-sh/setup-bun@v1
      
      - run: bun install --frozen-lockfile
      
      - run: bun test
      
      - run: bunx tsc --noEmit

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: oven-sh/setup-bun@v1
      
      - run: bun install --frozen-lockfile
      
      - run: bun run build
      
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  docker:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      
      - uses: docker/setup-buildx-action@v3
      
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/superversivesf/tempus-bede:latest
```

### Code Quality Standards

- **Linting**: Biome (fast, Bun-native)
- **Formatting**: Prettier with sensible defaults
- **Type Safety**: Strict TypeScript configuration
- **Commits**: Conventional commits format
- **PR Reviews**: Required for all changes

---

## Conclusion

Tempus-Bede is designed with simplicity, performance, and maintainability as core principles. The architecture supports:

- **Extensibility**: Easy addition of new dioceses
- **Scalability**: Stateful caching, stateless compute
- **Reliability**: Comprehensive error handling and testing
- **Operations**: Docker-native deployment with health checks

This document should be updated as the project evolves and new features are implemented.