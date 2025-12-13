import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatInTimeZone } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatInJakarta = (date: string | Date, formatStr: string) => {
  return formatInTimeZone(date, "Asia/Jakarta", formatStr);
};

export const getTextColor = (bgColor: string | null | undefined): string => {
  if (!bgColor) return '#1f2937'; // dark gray
  const color = bgColor.startsWith('#') ? bgColor.substring(1, 7) : bgColor;
  if (color.length !== 6) return '#1f2937';
  
  try {
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1f2937' : '#FFFFFF';
  } catch (e) {
    return '#1f2937';
  }
};