/**
 * Today endpoint for tempus-bede.
 * Returns liturgical day information for the current date.
 */

import { Hono } from 'hono';
import { getToday, isValidDiocese, DEFAULT_DIOCESE, SUPPORTED_DIOCESES } from '../utils';
import type { LiturgicalDayResponse, DioceseCode, ErrorResponse } from '../types';

const todayRouter = new Hono();

/**
 * GET /today
 * Returns the liturgical day for today.
 * 
 * Query Parameters:
 * - diocese: The diocese calendar to use (optional, defaults to 'united-states')
 * 
 * Responses:
 * - 200: LiturgicalDayResponse
 * - 400: ErrorResponse (invalid diocese)
 * - 404: ErrorResponse (no liturgical data found)
 */
todayRouter.get('/', async (c) => {
  // Get diocese from query parameter
  const dioceseParam = c.req.query('diocese');
  const diocese = dioceseParam || DEFAULT_DIOCESE;

  // Validate diocese
  if (dioceseParam && !isValidDiocese(dioceseParam)) {
    const errorResponse: ErrorResponse = {
      error: 'INVALID_DIOCESE',
      message: `Invalid diocese '${dioceseParam}'. Supported dioceses: ${SUPPORTED_DIOCESES.join(', ')}`,
      status: 400,
    };
    return c.json(errorResponse, 400);
  }

  try {
    const liturgicalDay = await getToday(diocese as DioceseCode);

    if (!liturgicalDay) {
      const errorResponse: ErrorResponse = {
        error: 'NOT_FOUND',
        message: 'No liturgical data found for today',
        status: 404,
      };
      return c.json(errorResponse, 404);
    }

    return c.json<LiturgicalDayResponse>(liturgicalDay);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: 'INTERNAL_ERROR',
      message: 'An error occurred while retrieving liturgical data',
      status: 500,
    };
    return c.json(errorResponse, 500);
  }
});

export default todayRouter;