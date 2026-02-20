declare module 'romcal' {
  export interface RomcalDay {
    moment: string | {
      format: (format: string) => string;
      valueOf: () => number;
    };
    type: string;
    name: string;
    key: string;
    source: string;
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
        psalterWeek?: {
          key: string;
          value: string;
        };
        cycle?: {
          key: string;
          value: string;
        };
      };
      calendar?: {
        weeks: number;
        week: number;
        day: number;
      };
      prioritized?: boolean;
    };
  }

  export interface CalendarOptions {
    year?: number;
    country?: string;
    locale?: string;
    christmastideEnds?: 't' | 'o' | 'e';
    epiphanyOnJan6?: boolean;
    christmastideIncludesTheSeasonOfEpiphany?: boolean;
    corpusChristiOnThursday?: boolean;
    ascensionOnSunday?: boolean;
    type?: 'calendar' | 'liturgical';
    query?: {
      day?: number;
      month?: number;
      group?: string;
      title?: string;
    };
  }

  export function calendarFor(options?: CalendarOptions | number, preserveMoment?: boolean): RomcalDay[];
  export function queryFor(key: string, options?: CalendarOptions): RomcalDay[];

  export const Countries: string[];
  export const Locales: Record<string, unknown>;
  export const Localizations: string[];

  export const Types: Record<string, string>;
  export const Titles: Record<string, string>;
  export const LiturgicalSeasons: Record<string, string>;
  export const LiturgicalColors: Record<string, string>;
  export const PsalterWeeks: Record<string, string>;
  export const Cycles: Record<string, string>;
}