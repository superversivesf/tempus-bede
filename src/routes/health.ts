/**
 * Health check endpoint for tempus-bede.
 * Returns service status for monitoring and load balancer checks.
 */

import { Hono } from 'hono';

const healthRouter = new Hono();

/**
 * GET /health
 * Returns the health status of the service.
 */
healthRouter.get('/', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'tempus-bede',
  });
});

export default healthRouter;