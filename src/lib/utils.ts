import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { format as formatTz, toZonedTime } from 'date-fns-tz';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeFormatDistanceToNow(date: string | Date | undefined | null): string {
  if (!date) {
    return '';
  }
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: id });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

export function getInitials(name?: string, fallback?: string): string {
  if (!name) return fallback ? fallback.slice(0, 2).toUpperCase() : 'NN';
  const nameParts = name.split(' ');
  if (nameParts.length > 1 && nameParts[0] && nameParts[nameParts.length - 1]) {
    return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function generatePastelColor(seed: string): { backgroundColor: string; color: string } {
  if (!seed) {
    const h = 0;
    const s = 0;
    const l = 80;
    const backgroundColor = `hsl(${h}, ${s}%, ${l}%)`; // A neutral gray
    const color = `hsl(${h}, ${s}%, 20%)`;
    return { backgroundColor, color };
  }
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  const s = 70; // saturation
  const l = 80; // lightness
  const backgroundColor = `hsl(${h}, ${s}%, ${l}%)`;
  const color = `hsl(${h}, ${s}%, 20%)`; // Darker color for text
  return { backgroundColor, color };
}

export function formatMentionsForDisplay(text: string): string {
  if (!text) return '';
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  return text.replace(mentionRegex, (match, name, id) => `**@${name}**`);
}

export function getAvatarUrl(avatarUrl: string | null | undefined, seed: string): string {
  if (avatarUrl) {
    return avatarUrl;
  }
  const colors = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return `https://api.dicebear.com/8.x/micah/svg?seed=${seed}&backgroundColor=${color}`;
}

export const getProjectStatusStyles = (status: string) => {
  switch (status) {
    case 'On Track':
    case 'Completed':
      return { tw: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', hex: '#10B981', bgHexLight: '#D1FAE5', bgHexDark: '#064E3B' };
    case 'At Risk':
    case 'Off Track':
      return { tw: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', hex: '#EF4444', bgHexLight: '#FEE2E2', bgHexDark: '#7F1D1D' };
    case 'On Hold':
      return { tw: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', hex: '#F59E0B', bgHexLight: '#FEF3C7', bgHexDark: '#78350F' };
    default:
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', hex: '#6B7280', bgHexLight: '#F3F4F6', bgHexDark: '#374151' };
  }
};

export const getPaymentStatusStyles = (status: string) => {
  switch (status) {
    case 'Paid':
      return { tw: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', bgHexLight: '#D1FAE5', bgHexDark: '#064E3B' };
    case 'Overdue':
      return { tw: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', bgHexLight: '#FEE2E2', bgHexDark: '#7F1D1D' };
    case 'Due':
      return { tw: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', bgHexLight: '#FEF3C7', bgHexDark: '#78350F' };
    case 'Unpaid':
    case 'Pending':
    case 'In Process':
      return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', bgHexLight: '#DBEAFE', bgHexDark: '#1E3A8A' };
    default:
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', bgHexLight: '#F3F4F6', bgHexDark: '#374151' };
  }
};

export const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return { tw: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', hex: '#EF4444' };
      case 'High':
        return { tw: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400', hex: '#F97316' };
      case 'Normal':
        return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', hex: '#3B82F6' };
      case 'Low':
        return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', hex: '#6B7280' };
      default:
        return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', hex: '#6B7280' };
    }
};

export const formatInJakarta = (date: string | Date, formatStr: string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    const timeZone = 'Asia/Jakarta';
    const zonedDate = toZonedTime(dateObj, timeZone);
    return formatTz(zonedDate, formatStr, { timeZone });
  } catch (error) {
    console.error('Error formatting date in Jakarta timezone:', error);
    return '';
  }
};

export const getErrorMessage = (error: any, defaultMessage = "An unexpected error occurred."): string => {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error.message === 'string') return error.message;
  return defaultMessage;
};

export const formatPhoneNumberForApi = (phone: string): string => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
};

export const parseMentions = (text: string): string[] => {
  const mentionRegex = /@\[[^\]]+\]\(([^)]+)\)/g;
  const matches = text.matchAll(mentionRegex);
  const userIds = Array.from(matches, match => match[2]);
  return userIds;
};

export const formatTaskText = (text: string, maxLength?: number): string => {
  if (!text) return '';
  let cleanedText = text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1');
  if (maxLength && cleanedText.length > maxLength) {
    return cleanedText.substring(0, maxLength) + '...';
  }
  return cleanedText;
};

export const isOverdue = (dueDateStr: string | null): boolean => {
  if (!dueDateStr) return false;
  const dueDate = new Date(dueDateStr);
  const now = new Date();
  return dueDate < now;
};

export const getTaskStatusStyles = (status: string) => {
  switch (status) {
    case 'Done':
      return { tw: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', hex: '#10B981' };
    case 'In Progress':
      return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', hex: '#3B82F6' };
    case 'Cancelled':
      return { tw: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', hex: '#EF4444' };
    case 'To do':
    default:
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', hex: '#6B7280' };
  }
};

export const getColorForTag = (tag: string): string => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 70%, 80%)`; // Pastel color
};