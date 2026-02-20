/**
 * Server entry point for tempus-bede.
 * Starts the Bun HTTP server with the Hono application.
 */

import app from './app';

// Get port from environment variable or default to 3000
const port = parseInt(process.env.PORT || '3000', 10);

console.log(`Starting tempus-bede server on port ${port}...`);

// Start the server using Bun's native HTTP server
export default {
  port,
  fetch: app.fetch,
};

// Log startup information
console.log(`Server running at http://localhost:${port}`);
console.log('Endpoints:');
console.log(`  GET /          - API info`);
console.log(`  GET /today     - Liturgical day for today`);
console.log(`  GET /date/:date - Liturgical day for specific date`);
console.log(`  GET /health    - Health check`);