/**
 * Tests for /today endpoint.
 */

import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import app from '../app';
import { clearCalendarCache } from '../utils/calendar';
import type { LiturgicalDayResponse, ErrorResponse } from '../types';

describe('GET /today', () => {
  beforeEach(() => {
    clearCalendarCache();
  });

  afterEach(() => {
    clearCalendarCache();
  });

  describe('happy path', () => {
    test('returns 200 with liturgical day data', async () => {
      const response = await app.request('/today');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data).toHaveProperty('date');
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('rank');
      expect(data).toHaveProperty('season');
      expect(data).toHaveProperty('color');
      expect(data).toHaveProperty('isFeast');
      expect(data).toHaveProperty('isSolemnity');
      expect(data).toHaveProperty('isOptional');
    });

    test('returns today\'s date', async () => {
      const response = await app.request('/today');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      expect(data.date).toBe(todayString);
    });

    test('uses default diocese (united-states) when not specified', async () => {
      const response = await app.request('/today');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data).toHaveProperty('date');
    });

    test('returns color as array', async () => {
      const response = await app.request('/today');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(Array.isArray(data.color)).toBe(true);
    });
  });

  describe('query parameter: diocese', () => {
    test('accepts valid diocese parameter', async () => {
      const response = await app.request('/today?diocese=england');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data).toHaveProperty('date');
    });

    test('accepts all supported dioceses', async () => {
      const dioceses = ['united-states', 'england', 'italy', 'france', 'spain', 'germany'];

      for (const diocese of dioceses) {
        const response = await app.request(`/today?diocese=${diocese}`);
        expect(response.status).toBe(200);
      }
    });

    test('returns 400 for invalid diocese', async () => {
      const response = await app.request('/today?diocese=invalid');
      expect(response.status).toBe(400);

      const data = (await response.json()) as ErrorResponse;
      expect(data.error).toBe('INVALID_DIOCESE');
      expect(data.message).toContain('invalid');
      expect(data.message).toContain('Supported dioceses');
    });

    test('returns 200 for empty diocese (uses default)', async () => {
      const response = await app.request('/today?diocese=');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data).toHaveProperty('date');
    });

    test('includes supported dioceses list in error message', async () => {
      const response = await app.request('/today?diocese=unknown');
      expect(response.status).toBe(400);

      const data = (await response.json()) as ErrorResponse;
      expect(data.message).toContain('united-states');
      expect(data.message).toContain('england');
    });
  });

  describe('response headers', () => {
    test('returns JSON content type', async () => {
      const response = await app.request('/today');
      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('error responses', () => {
    test('returns correct error structure', async () => {
      const response = await app.request('/today?diocese=invalid');
      expect(response.status).toBe(400);

      const data = (await response.json()) as ErrorResponse;
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('status');
    });
  });

  describe('different dioceses', () => {
    test('united-states returns valid data', async () => {
      const response = await app.request('/today?diocese=united-states');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data).toHaveProperty('date');
    });

    test('england returns valid data', async () => {
      const response = await app.request('/today?diocese=england');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data).toHaveProperty('date');
    });

    test('italy returns valid data', async () => {
      const response = await app.request('/today?diocese=italy');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data).toHaveProperty('date');
    });

    test('france returns valid data', async () => {
      const response = await app.request('/today?diocese=france');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data).toHaveProperty('date');
    });

    test('spain returns valid data', async () => {
      const response = await app.request('/today?diocese=spain');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data).toHaveProperty('date');
    });

    test('germany returns valid data', async () => {
      const response = await app.request('/today?diocese=germany');
      expect(response.status).toBe(200);

      const data = (await response.json()) as LiturgicalDayResponse;
      expect(data).toHaveProperty('date');
    });
  });

  describe('data types', () => {
    test('returns correct types for all fields', async () => {
      const response = await app.request('/today');
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
});