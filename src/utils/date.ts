/**
 * Date utility functions for tempus-bede.
 * Handles formatting, parsing, and validation of dates in YYYY-MM-DD format.
 */

/**
 * Formats a Date object to YYYY-MM-DD string format.
 * @param date - The Date object to format
 * @returns The formatted date string
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string to a Date object.
 * @param dateString - The date string to parse
 * @returns Date object if valid, null if invalid
 */
export function parseDate(dateString: string): Date | null {
  // Check basic format with regex
  const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = dateString.match(dateRegex);
  
  if (!match) {
    return null;
  }
  
  const yearStr = match[1]!;
  const monthStr = match[2]!;
  const dayStr = match[3]!;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  
  // Create date and validate it matches (catches invalid dates like 2026-02-30)
  const date = new Date(Date.UTC(year, month - 1, day));
  
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  
  return date;
}

/**
 * Validates whether a string is a valid date in YYYY-MM-DD format.
 * @param dateString - The string to validate
 * @returns true if valid, false otherwise
 */
export function isValidDate(dateString: string): boolean {
  return parseDate(dateString) !== null;
}

/**
 * Gets today's date as a YYYY-MM-DD string.
 * Uses UTC to ensure consistent results regardless of timezone.
 * @returns Today's date string
 */
export function getTodayString(): string {
  return formatDate(new Date());
}

/**
 * Gets the current year.
 * @returns The current year as a number
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}