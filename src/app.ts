/**
 * Hono application configuration for tempus-bede.
 * Sets up middleware, routes, and error handlers.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { todayRouter, dateRouter, healthRouter } from './routes';
import type { ErrorResponse } from './types';

/**
 * Create and configure the Hono application.
 */
const app = new Hono();

// Apply middleware
app.use('*', logger());
app.use('*', cors());

// Root endpoint - API info
app.get('/', (c) => {
  return c.json({
    name: 'tempus-bede',
    description: 'Liturgical calendar API service',
    version: '0.1.0',
    endpoints: {
      '/today': 'Get liturgical day for today',
      '/date/:date': 'Get liturgical day for a specific date (YYYY-MM-DD)',
      '/health': 'Health check endpoint',
    },
    supportedDioceses: ['united-states', 'england', 'italy', 'france', 'spain', 'germany'],
  });
});

// Mount route handlers
app.route('/today', todayRouter);
app.route('/date', dateRouter);
app.route('/health', healthRouter);

// 404 Not Found handler
app.notFound((c) => {
  const errorResponse: ErrorResponse = {
    error: 'NOT_FOUND',
    message: `Route ${c.req.path} not found`,
    status: 404,
  };
  return c.json(errorResponse, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  const errorResponse: ErrorResponse = {
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    status: 500,
  };
  return c.json(errorResponse, 500);
});

export default app;