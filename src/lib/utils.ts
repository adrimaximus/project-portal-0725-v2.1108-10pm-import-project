import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format as formatFns, utcToZonedTime } from 'date-fns-tz';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const jakartaTimeZone = 'Asia/Jakarta';

/**
 * Formats a date in the 'Asia/Jakarta' timezone.
 * @param date The date to format (string or Date object).
 * @param formatString The format string (e.g., 'd MMM yyyy').
 * @returns The formatted date string.
 */
export const formatInJakarta = (date: string | Date, formatString: string): string => {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    // The date from Supabase is in UTC. We need to treat it as such and convert to Jakarta time for display.
    const zonedDate = utcToZonedTime(dateObj, jakartaTimeZone);
    return formatFns(zonedDate, formatString, { timeZone: jakartaTimeZone });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
};