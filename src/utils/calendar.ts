/**
 * Calendar utility functions for tempus-bede.
 * Provides romcal integration with caching support.
 */

import { calendarFor } from 'romcal';
import type { DioceseCode, LiturgicalDayResponse, RomcalDay } from '../types';
import { formatDate, getCurrentYear } from './date';

/**
 * Mapping of our diocese codes to romcal's country names.
 * Romcal uses camelCase country names.
 */
const DIOCESE_TO_COUNTRY: Record<DioceseCode, string> = {
  'united-states': 'unitedStates',
  'england': 'england',
  'italy': 'italy',
  'france': 'france',
  'spain': 'spain',
  'germany': 'germany',
};

/**
 * List of supported diocese codes.
 */
export const SUPPORTED_DIOCESES: DioceseCode[] = [
  'united-states',
  'england',
  'italy',
  'france',
  'spain',
  'germany',
];

/**
 * Default diocese for calendar queries.
 */
export const DEFAULT_DIOCESE: DioceseCode = 'united-states';

/**
 * Check if a diocese code is valid/supported.
 * @param diocese - The diocese code to check
 * @returns true if the diocese is supported
 */
export function isValidDiocese(diocese: string): diocese is DioceseCode {
  return SUPPORTED_DIOCESES.includes(diocese as DioceseCode);
}

/**
 * Convert diocese code to romcal country name.
 * @param diocese - The diocese code
 * @returns The romcal country name
 */
export function dioceseToCountry(diocese: DioceseCode): string {
  return DIOCESE_TO_COUNTRY[diocese] || diocese;
}

/**
 * Calendar cache to store generated calendars.
 * Key: `${year}-${country}`, Value: Map of date string to RomcalDay
 */
const calendarCache = new Map<string, Map<string, RomcalDay>>();

/**
 * Get or create a calendar for a specific year and country.
 * Uses caching to avoid regenerating calendars.
 * @param year - The year to get the calendar for
 * @param country - The romcal country name
 * @returns A map of date strings to RomcalDay objects
 */
function getCalendar(year: number, country: string): Map<string, RomcalDay> {
  const cacheKey = `${year}-${country}`;
  
  if (calendarCache.has(cacheKey)) {
    return calendarCache.get(cacheKey)!;
  }
  
  // Generate the calendar for this year and country
  const calendar = calendarFor({
    year,
    country,
  }) as RomcalDay[];
  
  // Convert array to map for O(1) lookup by date
  const dateMap = new Map<string, RomcalDay>();
  
  for (const day of calendar) {
    // Extract date string from moment
    const dateStr = typeof day.moment === 'string' 
      ? day.moment.split('T')[0] ?? ''
      : day.moment.format('YYYY-MM-DD');
    if (dateStr) {
      dateMap.set(dateStr, day);
    }
  }
  
  // Cache the result
  calendarCache.set(cacheKey, dateMap);
  
  return dateMap;
}

/**
 * Convert a RomcalDay to our simplified LiturgicalDayResponse format.
 * @param day - The romcal day object
 * @returns Simplified liturgical day response
 */
function toLiturgicalDayResponse(day: RomcalDay): LiturgicalDayResponse {
  // Extract date string
  const dateStr = typeof day.moment === 'string' 
    ? (day.moment.split('T')[0] ?? '')
    : day.moment.format('YYYY-MM-DD');
  
  // Extract colors
  const colors: string[] = [];
  if (day.data?.meta?.liturgicalColor) {
    const colorData = day.data.meta.liturgicalColor;
    if (Array.isArray(colorData)) {
      colors.push(...colorData.map(c => c.key.toLowerCase()));
    } else {
      colors.push(colorData.key.toLowerCase());
    }
  }
  
  // Determine rank/type flags
  const type = day.type || '';
  const isSolemnity = type === 'SOLEMNITY';
  const isFeast = type === 'FEAST';
  const isOptional = type === 'OPT_MEMORIAL';
  
  return {
    date: dateStr ?? '',
    id: day.key || '',
    name: day.name || '',
    rank: type,
    season: day.data?.season?.key || '',
    color: colors,
    isFeast,
    isSolemnity,
    isOptional,
  };
}

/**
 * Get the liturgical day information for a specific date and diocese.
 * @param date - The date to look up
 * @param diocese - The diocese calendar to use (defaults to 'united-states')
 * @returns LiturgicalDayResponse if found, null otherwise
 */
export async function getLiturgicalDay(
  date: Date,
  diocese: DioceseCode = DEFAULT_DIOCESE
): Promise<LiturgicalDayResponse | null> {
  if (!isValidDiocese(diocese)) {
    return null;
  }
  
  const year = date.getFullYear();
  const country = dioceseToCountry(diocese);
  const dateStr = formatDate(date);
  
  try {
    const calendar = getCalendar(year, country);
    const day = calendar.get(dateStr);
    
    if (!day) {
      return null;
    }
    
    return toLiturgicalDayResponse(day);
  } catch (error) {
    console.error(`Error getting liturgical day for ${dateStr} in ${diocese}:`, error);
    return null;
  }
}

/**
 * Get the liturgical day information for today.
 * @param diocese - The diocese calendar to use (defaults to 'united-states')
 * @returns LiturgicalDayResponse if found, null otherwise
 */
export async function getToday(
  diocese: DioceseCode = DEFAULT_DIOCESE
): Promise<LiturgicalDayResponse | null> {
  return getLiturgicalDay(new Date(), diocese);
}

/**
 * Get all liturgical days for a year and diocese.
 * @param year - The year to get
 * @param diocese - The diocese calendar to use
 * @returns Array of LiturgicalDayResponse objects
 */
export async function getCalendarForYear(
  year: number,
  diocese: DioceseCode = DEFAULT_DIOCESE
): Promise<LiturgicalDayResponse[]> {
  if (!isValidDiocese(diocese)) {
    return [];
  }
  
  const country = dioceseToCountry(diocese);
  
  try {
    const calendar = getCalendar(year, country);
    const results: LiturgicalDayResponse[] = [];
    
    for (const day of calendar.values()) {
      results.push(toLiturgicalDayResponse(day));
    }
    
    // Sort by date
    results.sort((a, b) => a.date.localeCompare(b.date));
    
    return results;
  } catch (error) {
    console.error(`Error getting calendar for ${year} in ${diocese}:`, error);
    return [];
  }
}

/**
 * Clear the calendar cache.
 * Useful for testing or forcing refresh.
 */
export function clearCalendarCache(): void {
  calendarCache.clear();
}