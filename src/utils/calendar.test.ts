/**
 * Tests for calendar utility functions.
 */

import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import {
  isValidDiocese,
  SUPPORTED_DIOCESES,
  DEFAULT_DIOCESE,
  dioceseToCountry,
  getLiturgicalDay,
  getToday,
  getCalendarForYear,
  clearCalendarCache,
} from './calendar';
import type { DioceseCode } from '../types';

describe('isValidDiocese', () => {
  test('returns true for valid diocese codes', () => {
    expect(isValidDiocese('united-states')).toBe(true);
    expect(isValidDiocese('england')).toBe(true);
    expect(isValidDiocese('italy')).toBe(true);
    expect(isValidDiocese('france')).toBe(true);
    expect(isValidDiocese('spain')).toBe(true);
    expect(isValidDiocese('germany')).toBe(true);
  });

  test('returns false for invalid diocese codes', () => {
    expect(isValidDiocese('invalid')).toBe(false);
    expect(isValidDiocese('united_states')).toBe(false);
    expect(isValidDiocese('United-States')).toBe(false);
    expect(isValidDiocese('')).toBe(false);
    expect(isValidDiocese('poland')).toBe(false);
    expect(isValidDiocese('mexico')).toBe(false);
  });

  test('validates type guard functionality', () => {
    const testValue: string = 'united-states';
    if (isValidDiocese(testValue)) {
      // TypeScript should recognize testValue as DioceseCode here
      const _: DioceseCode = testValue;
      expect(true).toBe(true);
    }
  });
});

describe('SUPPORTED_DIOCESES', () => {
  test('contains all expected dioceses', () => {
    expect(SUPPORTED_DIOCESES).toContain('united-states');
    expect(SUPPORTED_DIOCESES).toContain('england');
    expect(SUPPORTED_DIOCESES).toContain('italy');
    expect(SUPPORTED_DIOCESES).toContain('france');
    expect(SUPPORTED_DIOCESES).toContain('spain');
    expect(SUPPORTED_DIOCESES).toContain('germany');
  });

  test('has correct length', () => {
    expect(SUPPORTED_DIOCESES.length).toBe(6);
  });

  test('is a readonly array', () => {
    // Runtime check that it's an array
    expect(Array.isArray(SUPPORTED_DIOCESES)).toBe(true);
  });
});

describe('DEFAULT_DIOCESE', () => {
  test('is set to united-states', () => {
    expect(DEFAULT_DIOCESE).toBe('united-states');
  });

  test('is a valid diocese', () => {
    expect(isValidDiocese(DEFAULT_DIOCESE)).toBe(true);
  });
});

describe('dioceseToCountry', () => {
  test('maps united-states to unitedStates', () => {
    expect(dioceseToCountry('united-states')).toBe('unitedStates');
  });

  test('maps england to england', () => {
    expect(dioceseToCountry('england')).toBe('england');
  });

  test('maps italy to italy', () => {
    expect(dioceseToCountry('italy')).toBe('italy');
  });

  test('maps france to france', () => {
    expect(dioceseToCountry('france')).toBe('france');
  });

  test('maps spain to spain', () => {
    expect(dioceseToCountry('spain')).toBe('spain');
  });

  test('maps germany to germany', () => {
    expect(dioceseToCountry('germany')).toBe('germany');
  });

  test('returns input for unknown diocese (fallback)', () => {
    // This tests the fallback behavior in the implementation
    const result = dioceseToCountry('unknown' as DioceseCode);
    expect(result).toBe('unknown');
  });
});

describe('getLiturgicalDay', () => {
  beforeEach(() => {
    clearCalendarCache();
  });

  afterEach(() => {
    clearCalendarCache();
  });

  test('returns liturgical day for valid date', async () => {
    const date = new Date(Date.UTC(2026, 11, 25)); // Christmas 2026
    const result = await getLiturgicalDay(date, 'united-states');

    expect(result).not.toBeNull();
    expect(result!.date).toBe('2026-12-25');
    expect(result!.name).toBeDefined();
  });

  test('returns null for invalid diocese', async () => {
    const date = new Date(Date.UTC(2026, 11, 25));
    const result = await getLiturgicalDay(date, 'invalid' as DioceseCode);
    expect(result).toBeNull();
  });

  test('uses default diocese when not specified', async () => {
    const date = new Date(Date.UTC(2026, 11, 25));
    const result = await getLiturgicalDay(date);

    expect(result).not.toBeNull();
    expect(result!.date).toBe('2026-12-25');
  });

  test('returns day with correct structure', async () => {
    const date = new Date(Date.UTC(2026, 11, 25));
    const result = await getLiturgicalDay(date, 'united-states');

    expect(result).not.toBeNull();
    expect(result).toHaveProperty('date');
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('rank');
    expect(result).toHaveProperty('season');
    expect(result).toHaveProperty('color');
    expect(result).toHaveProperty('isFeast');
    expect(result).toHaveProperty('isSolemnity');
    expect(result).toHaveProperty('isOptional');
  });

  test('returns color as array', async () => {
    const date = new Date(Date.UTC(2026, 11, 25));
    const result = await getLiturgicalDay(date, 'united-states');

    expect(result).not.toBeNull();
    expect(Array.isArray(result!.color)).toBe(true);
  });

  test('works with different dioceses', async () => {
    const date = new Date(Date.UTC(2026, 11, 25));

    const usResult = await getLiturgicalDay(date, 'united-states');
    const englandResult = await getLiturgicalDay(date, 'england');

    expect(usResult).not.toBeNull();
    expect(englandResult).not.toBeNull();
    // Christmas day should have the same date regardless of diocese
    expect(usResult!.date).toBe(englandResult!.date);
  });

  test('returns solemnity for Christmas', async () => {
    const date = new Date(Date.UTC(2026, 11, 25));
    const result = await getLiturgicalDay(date, 'united-states');

    expect(result).not.toBeNull();
    expect(result!.isSolemnity).toBe(true);
  });

  test('returns result for January 1', async () => {
    const date = new Date(Date.UTC(2026, 0, 1));
    const result = await getLiturgicalDay(date, 'united-states');

    expect(result).not.toBeNull();
    expect(result!.date).toBe('2026-01-01');
  });

  test('returns result for Easter date 2026', async () => {
    // Easter Sunday 2026 is April 5
    const date = new Date(Date.UTC(2026, 3, 5));
    const result = await getLiturgicalDay(date, 'united-states');

    expect(result).not.toBeNull();
    expect(result!.date).toBe('2026-04-05');
  });
});

describe('getToday', () => {
  beforeEach(() => {
    clearCalendarCache();
  });

  afterEach(() => {
    clearCalendarCache();
  });

  test('returns liturgical day for today', async () => {
    const result = await getToday('united-states');

    expect(result).not.toBeNull();
    expect(result!.date).toBeDefined();
  });

  test('uses default diocese when not specified', async () => {
    const result = await getToday();

    expect(result).not.toBeNull();
  });

  test('returns null for invalid diocese', async () => {
    const result = await getToday('invalid' as DioceseCode);
    expect(result).toBeNull();
  });

  test('returns current date', async () => {
    const result = await getToday('united-states');
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    expect(result).not.toBeNull();
    expect(result!.date).toBe(todayString);
  });
});

describe('getCalendarForYear', () => {
  beforeEach(() => {
    clearCalendarCache();
  });

  afterEach(() => {
    clearCalendarCache();
  });

  test('returns array of liturgical days for a year', async () => {
    const result = await getCalendarForYear(2026, 'united-states');

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('returns empty array for invalid diocese', async () => {
    const result = await getCalendarForYear(2026, 'invalid' as DioceseCode);
    expect(result).toEqual([]);
  });

  test('uses default diocese when not specified', async () => {
    const result = await getCalendarForYear(2026);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('returns days sorted by date', async () => {
    const result = await getCalendarForYear(2026, 'united-states');
    const dates = result.map(d => d.date);

    const sortedDates = [...dates].sort();
    expect(dates).toEqual(sortedDates);
  });

  test('includes expected major feasts', async () => {
    const result = await getCalendarForYear(2026, 'united-states');
    const dates = result.map(d => d.date);

    // Christmas should be present
    expect(dates).toContain('2026-12-25');
  });

  test('each day has required properties', async () => {
    const result = await getCalendarForYear(2026, 'united-states');

    for (const day of result) {
      expect(day).toHaveProperty('date');
      expect(day).toHaveProperty('id');
      expect(day).toHaveProperty('name');
      expect(day).toHaveProperty('rank');
      expect(day).toHaveProperty('season');
      expect(day).toHaveProperty('color');
      expect(day).toHaveProperty('isFeast');
      expect(day).toHaveProperty('isSolemnity');
      expect(day).toHaveProperty('isOptional');
    }
  });
});

describe('clearCalendarCache', () => {
  test('clears the calendar cache', async () => {
    // Populate the cache
    await getLiturgicalDay(new Date(Date.UTC(2026, 11, 25)), 'united-states');

    // Clear the cache
    clearCalendarCache();

    // The cache should be empty (this is an internal detail, but we can test
    // the function runs without error)
    expect(() => clearCalendarCache()).not.toThrow();
  });

  test('can be called multiple times safely', () => {
    clearCalendarCache();
    clearCalendarCache();
    clearCalendarCache();
    expect(true).toBe(true);
  });
});

describe('Cache behavior', () => {
  beforeEach(() => {
    clearCalendarCache();
  });

  afterEach(() => {
    clearCalendarCache();
  });

  test('caches calendar lookups', async () => {
    const date = new Date(Date.UTC(2026, 11, 25));

    // First call should populate cache
    const result1 = await getLiturgicalDay(date, 'united-states');

    // Second call should use cache
    const result2 = await getLiturgicalDay(date, 'united-states');

    expect(result1).toEqual(result2);
  });

  test('different years create separate cache entries', async () => {
    const date2026 = new Date(Date.UTC(2026, 11, 25));
    const date2025 = new Date(Date.UTC(2025, 11, 25));

    const result2026 = await getLiturgicalDay(date2026, 'united-states');
    const result2025 = await getLiturgicalDay(date2025, 'united-states');

    expect(result2026).not.toBeNull();
    expect(result2025).not.toBeNull();
    expect(result2026!.date).toBe('2026-12-25');
    expect(result2025!.date).toBe('2025-12-25');
  });

  test('different dioceses create separate cache entries', async () => {
    const date = new Date(Date.UTC(2026, 11, 25));

    const usResult = await getLiturgicalDay(date, 'united-states');
    const englandResult = await getLiturgicalDay(date, 'england');

    // Both should return results
    expect(usResult).not.toBeNull();
    expect(englandResult).not.toBeNull();
  });
});