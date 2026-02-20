# tempus-bede

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Bun](https://img.shields.io/badge/runtime-bun-black.svg)](https://bun.sh)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)

A fast, lightweight liturgical calendar API built with [Bun](https://bun.sh) and [Hono](https://hono.dev), powered by [romcal](https://github.com/romcal/romcal).

## Description

**tempus-bede** provides a RESTful API for querying Catholic liturgical calendar data. It wraps the romcal library to deliver clean, structured JSON responses about liturgical days, including feast days, solemnities, memorials, and liturgical seasons across multiple national calendars.

## Features

- **RESTful API** - Simple HTTP endpoints for querying liturgical data
- **Multi-Diocese Support** - Query calendars for 6 different national/diocesan calendars
- **Docker Ready** - Production-ready multi-stage Dockerfile included
- **Bun Runtime** - Built on Bun for fast startup and low memory footprint
- **Cached Responses** - Calendar data is cached for optimal performance
- **CORS Enabled** - Ready for cross-origin requests from web applications
- **Health Check** - Built-in health endpoint for container orchestration

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) >= 1.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/superversivesf/tempus-bede.git
cd tempus-bede

# Install dependencies
bun install

# Start the server
bun start
```

The server will start on `http://localhost:3000` by default.

## API Reference

### GET /

Returns API information and available endpoints.

**Response:**
```json
{
  "name": "tempus-bede",
  "description": "Liturgical calendar API service",
  "version": "0.1.0",
  "endpoints": {
    "/today": "Get liturgical day for today",
    "/date/:date": "Get liturgical day for a specific date (YYYY-MM-DD)",
    "/health": "Health check endpoint"
  },
  "supportedDioceses": ["united-states", "england", "italy", "france", "spain", "germany"]
}
```

### GET /today

Returns the liturgical day for today's date.

**Query Parameters:**
| Parameter | Type   | Required | Description                                        |
|-----------|--------|----------|----------------------------------------------------|
| diocese   | string | No       | Diocese calendar to use (defaults to `united-states`) |

**Example:**
```bash
curl http://localhost:3000/today
curl http://localhost:3000/today?diocese=england
```

**Response:**
```json
{
  "date": "2024-12-25",
  "id": "christmas_day",
  "name": "Christmas Day",
  "rank": "SOLEMNITY",
  "season": "christmas",
  "color": ["white"],
  "isFeast": false,
  "isSolemnity": true,
  "isOptional": false
}
```

### GET /date/:date

Returns the liturgical day for a specific date.

**Path Parameters:**
| Parameter | Type   | Required | Description                    |
|-----------|--------|----------|--------------------------------|
| date      | string | Yes      | Date in `YYYY-MM-DD` format    |

**Query Parameters:**
| Parameter | Type   | Required | Description                                        |
|-----------|--------|----------|----------------------------------------------------|
| diocese   | string | No       | Diocese calendar to use (defaults to `united-states`) |

**Example:**
```bash
curl http://localhost:3000/date/2024-12-25
curl http://localhost:3000/date/2024-03-17?diocese=ireland
```

### GET /health

Returns the health status of the service. Useful for load balancers and container orchestration.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-25T12:00:00.000Z",
  "service": "tempus-bede"
}
```

## Response Format

All successful responses return a `LiturgicalDayResponse` object:

| Field        | Type      | Description                                      |
|--------------|-----------|--------------------------------------------------|
| `date`       | string    | ISO date string (YYYY-MM-DD)                     |
| `id`         | string    | Unique identifier for the celebration            |
| `name`       | string    | Display name of the celebration                  |
| `rank`       | string    | Liturgical rank (e.g., `SOLEMNITY`, `FEAST`, `MEMORIAL`) |
| `season`     | string    | Liturgical season key (e.g., `advent`, `christmas`, `lent`) |
| `color`      | string[]  | Liturgical colors (e.g., `["white"]`, `["red"]`) |
| `isFeast`    | boolean   | Whether this is a feast                          |
| `isSolemnity`| boolean   | Whether this is a solemnity                      |
| `isOptional` | boolean   | Whether this is an optional memorial             |

### Error Responses

Errors return a structured `ErrorResponse`:

```json
{
  "error": "INVALID_DATE",
  "message": "Invalid date format '2024-1-1'. Expected YYYY-MM-DD format.",
  "status": 400
}
```

| Error Code        | HTTP Status | Description                          |
|-------------------|-------------|--------------------------------------|
| `INVALID_DATE`    | 400         | Date format is invalid               |
| `INVALID_DIOCESE` | 400         | Diocese code is not supported        |
| `NOT_FOUND`       | 404         | No liturgical data found for date    |
| `INTERNAL_ERROR`  | 500         | Server error occurred                |

## Supported Dioceses

tempus-bede supports the following national calendars:

| Diocese Code    | Description           |
|-----------------|-----------------------|
| `united-states` | United States (default) |
| `england`       | England               |
| `italy`         | Italy                 |
| `france`        | France                |
| `spain`         | Spain                 |
| `germany`       | Germany               |

## Docker

### Build

```bash
docker build -t tempus-bede:latest .
```

### Run

```bash
docker run -p 3000:3000 tempus-bede:latest
```

The container exposes port 3000 and includes a health check at `/health`.

### Docker Compose (Optional)

```yaml
version: '3.8'
services:
  tempus-bede:
    image: tempus-bede:latest
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
```

## Development

### Scripts

```bash
# Start development server with hot reload
bun run dev

# Run tests
bun test

# Build for production
bun run build

# Start production server
bun start
```

### Project Structure

```
tempus-bede/
├── src/
│   ├── index.ts       # Server entry point
│   ├── app.ts         # Hono application configuration
│   ├── routes/
│   │   ├── index.ts   # Route exports
│   │   ├── today.ts   # GET /today endpoint
│   │   ├── date.ts    # GET /date/:date endpoint
│   │   └── health.ts  # GET /health endpoint
│   ├── utils/
│   │   ├── index.ts   # Utility exports
│   │   ├── date.ts    # Date utilities
│   │   └── calendar.ts # Romcal integration
│   └── types/
│       └── index.ts   # TypeScript type definitions
├── Dockerfile
├── package.json
└── tsconfig.json
```

## License

Licensed under the Apache License, Version 2.0. See the [LICENSE](LICENSE) file for details.

```
Copyright 2024 Superversive SF

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```