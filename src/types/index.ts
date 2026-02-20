/**
 * Supported diocese codes for liturgical calendar queries.
 * These map to romcal's built-in national calendars.
 */
export type DioceseCode = 'united-states' | 'england' | 'italy' | 'france' | 'spain' | 'germany';

/**
 * Response object for a liturgical day query.
 */
export interface LiturgicalDayResponse {
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** Unique identifier for the celebration */
  id: string;
  /** Display name of the celebration */
  name: string;
  /** Liturgical rank (e.g., 'SOLEMNITY', 'FEAST', 'MEMORIAL') */
  rank: string;
  /** Liturgical season key */
  season: string;
  /** Liturgical colors for the celebration */
  color: string[];
  /** Whether this is a feast */
  isFeast: boolean;
  /** Whether this is a solemnity */
  isSolemnity: boolean;
  /** Whether this is an optional memorial */
  isOptional: boolean;
}

/**
 * Query parameters for calendar API endpoints.
 */
export interface CalendarQuery {
  /** The diocese calendar to use (defaults to 'united-states') */
  diocese?: DioceseCode;
}

/**
 * Standard error response structure.
 */
export interface ErrorResponse {
  /** Error code for programmatic handling */
  error: string;
  /** Human-readable error message */
  message: string;
  /** HTTP status code */
  status: number;
}

/**
 * Internal romcal liturgical day structure.
 * Represents the raw output from romcal's calendarFor().
 */
export interface RomcalDay {
  /** ISO date string or Moment object */
  moment: string | { 
    format: (format: string) => string;
    valueOf: () => number;
  };
  /** Celebration type/rank */
  type: string;
  /** Display name */
  name: string;
  /** Unique key identifier */
  key: string;
  /** Calendar source */
  source: string;
  /** Additional metadata */
  data: {
    season?: {
      key: string;
      value: string;
    };
    meta?: {
      titles?: string[];
      liturgicalColor?: {
        key: string;
        value: string;
      } | Array<{
        key: string;
        value: string;
      }>;
    };
    prioritized?: boolean;
  };
}