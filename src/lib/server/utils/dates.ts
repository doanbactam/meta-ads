import { format } from 'date-fns';

/**
 * Convert DB Date to API yyyy-MM-dd string or undefined
 * Used when returning dates to the client via API
 */
export function toApiDateOnly(d?: Date | null): string | undefined {
  if (!d) return undefined;
  return format(d, 'yyyy-MM-dd');
}

/**
 * Accepts Date or string (yyyy-MM-dd/ISO) and returns Date for DB
 * Used when receiving dates from the client for database storage
 */
export function toDbDate(input?: string | Date | null): Date | undefined {
  if (!input) return undefined;
  if (input instanceof Date) return input;
  const parsed = new Date(input);
  if (isNaN(parsed.getTime())) return undefined;
  return parsed;
}
