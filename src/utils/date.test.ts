/**
 * Tests for date utility functions.
 */

import { test, expect, describe } from 'bun:test';
import { formatDate, parseDate, isValidDate, getTodayString, getCurrentYear } from './date';

describe('formatDate', () => {
  test('formats a Date object to YYYY-MM-DD string', () => {
    const date = new Date(Date.UTC(2026, 1, 15)); // February 15, 2026
    expect(formatDate(date)).toBe('2026-02-15');
  });

  test('pads single digit months with zero', () => {
    const date = new Date(Date.UTC(2026, 0, 5)); // January 5, 2026
    expect(formatDate(date)).toBe('2026-01-05');
  });

  test('pads single digit days with zero', () => {
    const date = new Date(Date.UTC(2026, 2, 7)); // March 7, 2026
    expect(formatDate(date)).toBe('2026-03-07');
  });

  test('handles December (month 12)', () => {
    const date = new Date(Date.UTC(2026, 11, 25)); // December 25, 2026
    expect(formatDate(date)).toBe('2026-12-25');
  });

  test('handles year transition dates', () => {
    const date = new Date(Date.UTC(2026, 0, 1)); // January 1, 2026
    expect(formatDate(date)).toBe('2026-01-01');
  });

  test('handles leap year date', () => {
    const date = new Date(Date.UTC(2024, 1, 29)); // February 29, 2024 (leap year)
    expect(formatDate(date)).toBe('2024-02-29');
  });
});

describe('parseDate', () => {
  test('parses valid YYYY-MM-DD string', () => {
    const result = parseDate('2026-02-15');
    expect(result).not.toBeNull();
    expect(result!.getUTCFullYear()).toBe(2026);
    expect(result!.getUTCMonth()).toBe(1); // February (0-indexed)
    expect(result!.getUTCDate()).toBe(15);
  });

  test('parses January 1', () => {
    const result = parseDate('2026-01-01');
    expect(result).not.toBeNull();
    expect(result!.getUTCFullYear()).toBe(2026);
    expect(result!.getUTCMonth()).toBe(0);
    expect(result!.getUTCDate()).toBe(1);
  });

  test('parses December 31', () => {
    const result = parseDate('2026-12-31');
    expect(result).not.toBeNull();
    expect(result!.getUTCFullYear()).toBe(2026);
    expect(result!.getUTCMonth()).toBe(11);
    expect(result!.getUTCDate()).toBe(31);
  });

  test('parses leap year February 29', () => {
    const result = parseDate('2024-02-29');
    expect(result).not.toBeNull();
    expect(result!.getUTCFullYear()).toBe(2024);
    expect(result!.getUTCMonth()).toBe(1);
    expect(result!.getUTCDate()).toBe(29);
  });

  test('returns null for invalid format - no dashes', () => {
    expect(parseDate('20260215')).toBeNull();
  });

  test('returns null for invalid format - wrong order', () => {
    expect(parseDate('15-02-2026')).toBeNull();
  });

  test('returns null for invalid format - missing leading zeros', () => {
    expect(parseDate('2026-2-15')).toBeNull();
  });

  test('returns null for invalid format - text', () => {
    expect(parseDate('not-a-date')).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(parseDate('')).toBeNull();
  });

  test('returns null for invalid date - February 30', () => {
    expect(parseDate('2026-02-30')).toBeNull();
  });

  test('returns null for invalid date - February 29 in non-leap year', () => {
    expect(parseDate('2025-02-29')).toBeNull();
  });

  test('returns null for invalid date - month 13', () => {
    expect(parseDate('2026-13-01')).toBeNull();
  });

  test('returns null for invalid date - month 00', () => {
    expect(parseDate('2026-00-15')).toBeNull();
  });

  test('returns null for invalid date - day 00', () => {
    expect(parseDate('2026-02-00')).toBeNull();
  });

  test('returns null for invalid date - day 32', () => {
    expect(parseDate('2026-01-32')).toBeNull();
  });

  test('returns null for invalid date - April 31', () => {
    expect(parseDate('2026-04-31')).toBeNull();
  });

  test('parses date with extra whitespace - fails', () => {
    expect(parseDate(' 2026-02-15 ')).toBeNull();
  });
});

describe('isValidDate', () => {
  test('returns true for valid date strings', () => {
    expect(isValidDate('2026-02-15')).toBe(true);
    expect(isValidDate('2026-01-01')).toBe(true);
    expect(isValidDate('2026-12-31')).toBe(true);
  });

  test('returns true for leap year February 29', () => {
    expect(isValidDate('2024-02-29')).toBe(true);
  });

  test('returns false for invalid date strings', () => {
    expect(isValidDate('not-a-date')).toBe(false);
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isValidDate('2026-13-01')).toBe(false);
  });

  test('returns false for non-leap year February 29', () => {
    expect(isValidDate('2025-02-29')).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(isValidDate('')).toBe(false);
  });

  test('returns false for malformed strings', () => {
    expect(isValidDate('2026/02/15')).toBe(false);
    expect(isValidDate('02-15-2026')).toBe(false);
    expect(isValidDate('2026-2-15')).toBe(false);
  });
});

describe('getTodayString', () => {
  test('returns a valid YYYY-MM-DD format', () => {
    const today = getTodayString();
    expect(isValidDate(today)).toBe(true);
  });

  test('returns current date in correct format', () => {
    const today = getTodayString();
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    expect(dateRegex.test(today)).toBe(true);
  });

  test('returns a string matching parseDate output', () => {
    const today = getTodayString();
    const parsed = parseDate(today);
    expect(parsed).not.toBeNull();
    expect(formatDate(parsed!)).toBe(today);
  });
});

describe('getCurrentYear', () => {
  test('returns the current year as a number', () => {
    const year = getCurrentYear();
    expect(typeof year).toBe('number');
    expect(year).toBeGreaterThan(2020);
    expect(year).toBeLessThan(2100);
  });

  test('returns a 4-digit year', () => {
    const year = getCurrentYear();
    expect(year.toString().length).toBe(4);
  });
});

describe('formatDate and parseDate round-trip', () => {
  test('round-trip preserves date', () => {
    const original = new Date(Date.UTC(2026, 5, 15)); // June 15, 2026
    const formatted = formatDate(original);
    const parsed = parseDate(formatted);
    
    expect(parsed).not.toBeNull();
    expect(parsed!.getUTCFullYear()).toBe(original.getUTCFullYear());
    expect(parsed!.getUTCMonth()).toBe(original.getUTCMonth());
    expect(parsed!.getUTCDate()).toBe(original.getUTCDate());
  });

  test('multiple round-trips preserve date', () => {
    const original = new Date(Date.UTC(2026, 11, 25)); // December 25, 2026
    
    let current = original;
    for (let i = 0; i < 5; i++) {
      const formatted = formatDate(current);
      const parsed = parseDate(formatted);
      expect(parsed).not.toBeNull();
      current = parsed!;
    }
    
    expect(current.getUTCFullYear()).toBe(original.getUTCFullYear());
    expect(current.getUTCMonth()).toBe(original.getUTCMonth());
    expect(current.getUTCDate()).toBe(original.getUTCDate());
  });
});