/**
 * Date endpoint for tempus-bede.
 * Returns liturgical day information for a specific date.
 */

import { Hono } from 'hono';
import { getLiturgicalDay, isValidDiocese, isValidDate, parseDate, DEFAULT_DIOCESE, SUPPORTED_DIOCESES } from '../utils';
import type { LiturgicalDayResponse, DioceseCode, ErrorResponse } from '../types';

const dateRouter = new Hono();

/**
 * GET /date/:date
 * Returns the liturgical day for a specific date.
 * 
 * Path Parameters:
 * - date: The date in YYYY-MM-DD format
 * 
 * Query Parameters:
 * - diocese: The diocese calendar to use (optional, defaults to 'united-states')
 * 
 * Responses:
 * - 200: LiturgicalDayResponse
 * - 400: ErrorResponse (invalid date format or invalid diocese)
 * - 404: ErrorResponse (no liturgical data found)
 */
dateRouter.get('/:date', async (c) => {
  // Get date from path parameter
  const dateParam = c.req.param('date');

  // Validate date format
  if (!isValidDate(dateParam)) {
    const errorResponse: ErrorResponse = {
      error: 'INVALID_DATE',
      message: `Invalid date format '${dateParam}'. Expected YYYY-MM-DD format.`,
      status: 400,
    };
    return c.json(errorResponse, 400);
  }

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

  // Parse the date
  const date = parseDate(dateParam);
  if (!date) {
    const errorResponse: ErrorResponse = {
      error: 'INVALID_DATE',
      message: `Invalid date '${dateParam}'.`,
      status: 400,
    };
    return c.json(errorResponse, 400);
  }

  try {
    const liturgicalDay = await getLiturgicalDay(date, diocese as DioceseCode);

    if (!liturgicalDay) {
      const errorResponse: ErrorResponse = {
        error: 'NOT_FOUND',
        message: `No liturgical data found for date '${dateParam}'`,
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

export default dateRouter;