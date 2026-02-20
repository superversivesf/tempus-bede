/**
 * Tests for /date/:date endpoint.
 */

import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import app from '../app';
import { clearCalendarCache } from '../utils/calendar';
import type { LiturgicalDayResponse, ErrorResponse } from '../types';

describe('GET /date/:date', () => {
  beforeEach(() => {
    clearCalendarCache();
  });

  afterEach(() => {
    clearCalendarCache();
  });

  describe('happy path', () => {
    test('returns 200 with liturgical day data for valid date', async () => {
      const response = await app.request('/date/2026-12-25');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data).toHaveProperty('date');
      expect(data.date).toBe('2026-12-25');
    });

    test('returns expected data for Christmas', async () => {
      const response = await app.request('/date/2026-12-25');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data.date).toBe('2026-12-25');
      expect(data.isSolemnity).toBe(true);
    });

    test('returns valid data for January 1', async () => {
      const response = await app.request('/date/2026-01-01');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data.date).toBe('2026-01-01');
    });

    test('returns valid data for random date', async () => {
      const response = await app.request('/date/2026-03-15');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data).toHaveProperty('date');
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('name');
    });

    test('uses default diocese when not specified', async () => {
      const response = await app.request('/date/2026-12-25');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data.date).toBe('2026-12-25');
    });

    test('returns color as array', async () => {
      const response = await app.request('/date/2026-12-25');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(Array.isArray(data.color)).toBe(true);
    });
  });

  describe('path parameter validation: date', () => {
    test('returns 400 for invalid date format - no dashes', async () => {
      const response = await app.request('/date/20261225');
      expect(response.status).toBe(400);

      const data = (await response.json()) as ErrorResponse;
      expect(data.error).toBe('INVALID_DATE');
      expect(data.message).toContain('Invalid date format');
    });

    test('returns 400 for invalid date format - wrong order', async () => {
      const response = await app.request('/date/25-12-2026');
      expect(response.status).toBe(400);

      const data = (await response.json()) as ErrorResponse;
      expect(data.error).toBe('INVALID_DATE');
    });

    test('returns 400 for invalid date format - missing leading zeros', async () => {
      const response = await app.request('/date/2026-2-15');
      expect(response.status).toBe(400);

      const data = (await response.json()) as ErrorResponse;
      expect(data.error).toBe('INVALID_DATE');
    });

    test('returns 400 for invalid date - February 30', async () => {
      const response = await app.request('/date/2026-02-30');
      expect(response.status).toBe(400);

      const data = (await response.json()) as ErrorResponse;
      expect(data.error).toBe('INVALID_DATE');
    });

    test('returns 400 for invalid date - February 29 in non-leap year', async () => {
      const response = await app.request('/date/2025-02-29');
      expect(response.status).toBe(400);

      const data = (await response.json()) as ErrorResponse;
      expect(data.error).toBe('INVALID_DATE');
    });

    test('returns 400 for invalid date - month 13', async () => {
      const response = await app.request('/date/2026-13-01');
      expect(response.status).toBe(400);

      const data = (await response.json()) as ErrorResponse;
      expect(data.error).toBe('INVALID_DATE');
    });

    test('returns 400 for invalid date - text', async () => {
      const response = await app.request('/date/not-a-date');
      expect(response.status).toBe(400);

      const data = (await response.json()) as ErrorResponse;
      expect(data.error).toBe('INVALID_DATE');
    });

    test('returns 400 for empty date', async () => {
      const response = await app.request('/date/');
      // This should hit the 404 handler since the route expects a date parameter
      expect(response.status).toBe(404);
    });

    test('accepts leap year February 29', async () => {
      const response = await app.request('/date/2024-02-29');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data.date).toBe('2024-02-29');
    });

    test('error message mentions expected format', async () => {
      const response = await app.request('/date/invalid');
      expect(response.status).toBe(400);

      const data = (await response.json()) as ErrorResponse;
      expect(data.message).toContain('YYYY-MM-DD');
    });
  });

  describe('query parameter: diocese', () => {
    test('accepts valid diocese parameter', async () => {
      const response = await app.request('/date/2026-12-25?diocese=england');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data.date).toBe('2026-12-25');
    });

    test('accepts all supported dioceses', async () => {
      const dioceses = ['united-states', 'england', 'italy', 'france', 'spain', 'germany'];

      for (const diocese of dioceses) {
        const response = await app.request(`/date/2026-12-25?diocese=${diocese}`);
        expect(response.status).toBe(200);
      }
    });

    test('returns 400 for invalid diocese', async () => {
      const response = await app.request('/date/2026-12-25?diocese=invalid');
      expect(response.status).toBe(400);

      const data = (await response.json()) as ErrorResponse;
      expect(data.error).toBe('INVALID_DIOCESE');
      expect(data.message).toContain('Supported dioceses');
    });

    test('returns 200 for empty diocese (uses default)', async () => {
      const response = await app.request('/date/2026-12-25?diocese=');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data.date).toBe('2026-12-25');
    });

    test('includes supported dioceses list in error message', async () => {
      const response = await app.request('/date/2026-12-25?diocese=unknown');
      expect(response.status).toBe(400);

      const data = (await response.json()) as ErrorResponse;
      expect(data.message).toContain('united-states');
      expect(data.message).toContain('england');
    });
  });

  describe('response headers', () => {
    test('returns JSON content type', async () => {
      const response = await app.request('/date/2026-12-25');
      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('error responses', () => {
    test('returns correct error structure for invalid date', async () => {
      const response = await app.request('/date/invalid');
      expect(response.status).toBe(400);

      const data = (await response.json()) as ErrorResponse;
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('status');
      expect(data.status).toBe(400);
    });

    test('returns correct error structure for invalid diocese', async () => {
      const response = await app.request('/date/2026-12-25?diocese=invalid');
      expect(response.status).toBe(400);

      const data = (await response.json()) as ErrorResponse;
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('status');
      expect(data.status).toBe(400);
    });
  });

  describe('specific dates', () => {
    test('Easter Sunday 2026 (April 5)', async () => {
      const response = await app.request('/date/2026-04-05');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data.date).toBe('2026-04-05');
    });

    test('Christmas 2026', async () => {
      const response = await app.request('/date/2026-12-25');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data.date).toBe('2026-12-25');
      expect(data.isSolemnity).toBe(true);
    });

    test('New Year 2026 (January 1)', async () => {
      const response = await app.request('/date/2026-01-01');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data.date).toBe('2026-01-01');
    });

    test('All Saints Day (November 1)', async () => {
      const response = await app.request('/date/2026-11-01');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data.date).toBe('2026-11-01');
    });

    test('Ash Wednesday 2026 (February 18)', async () => {
      const response = await app.request('/date/2026-02-18');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data.date).toBe('2026-02-18');
    });
  });

  describe('different dioceses', () => {
    test('returns data for united-states', async () => {
      const response = await app.request('/date/2026-12-25?diocese=united-states');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data.date).toBe('2026-12-25');
    });

    test('returns data for england', async () => {
      const response = await app.request('/date/2026-12-25?diocese=england');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data.date).toBe('2026-12-25');
    });

    test('returns data for italy', async () => {
      const response = await app.request('/date/2026-12-25?diocese=italy');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data.date).toBe('2026-12-25');
    });

    test('returns data for france', async () => {
      const response = await app.request('/date/2026-12-25?diocese=france');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data.date).toBe('2026-12-25');
    });

    test('returns data for spain', async () => {
      const response = await app.request('/date/2026-12-25?diocese=spain');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data.date).toBe('2026-12-25');
    });

    test('returns data for germany', async () => {
      const response = await app.request('/date/2026-12-25?diocese=germany');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data.date).toBe('2026-12-25');
    });
  });

  describe('data types', () => {
    test('returns correct types for all fields', async () => {
      const response = await app.request('/date/2026-12-25');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(typeof data.date).toBe('string');
      expect(typeof data.id).toBe('string');
      expect(typeof data.name).toBe('string');
      expect(typeof data.rank).toBe('string');
      expect(typeof data.season).toBe('string');
      expect(Array.isArray(data.color)).toBe(true);
      expect(typeof data.isFeast).toBe('boolean');
      expect(typeof data.isSolemnity).toBe('boolean');
      expect(typeof data.isOptional).toBe('boolean');
    });
  });

  describe('different years', () => {
    test('handles dates from 2024', async () => {
      const response = await app.request('/date/2024-12-25');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data.date).toBe('2024-12-25');
    });

    test('handles dates from 2025', async () => {
      const response = await app.request('/date/2025-12-25');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data.date).toBe('2025-12-25');
    });

    test('handles dates from 2026', async () => {
      const response = await app.request('/date/2026-12-25');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data.date).toBe('2026-12-25');
    });
  });
});