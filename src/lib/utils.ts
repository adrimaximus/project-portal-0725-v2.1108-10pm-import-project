import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { User } from "@/types";
import { formatInTimeZone } from 'date-fns-tz';
import { isPast } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAvatarUrl(avatarUrl: string | null | undefined, userId: string): string {
  if (avatarUrl && avatarUrl.startsWith('http')) {
    return avatarUrl;
  }
  // Fallback or default avatar logic can be implemented here if needed
  return `https://api.dicebear.com/8.x/micah/svg?seed=${userId}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

export function generatePastelColor(seed: string) {
  if (!seed) {
    const h = Math.floor(Math.random() * 360);
    return { backgroundColor: `hsl(${h}, 70%, 85%)` };
  }
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return { backgroundColor: `hsl(${h}, 70%, 85%)` };
}

export const getColorForTag = (tagName: string): string => {
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  // Using a more vibrant saturation/lightness for tags
  return `hsl(${h}, 60%, 70%)`;
};

export function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const nameParts = name.split(' ').filter(Boolean);
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    if (nameParts.length === 1 && nameParts[0].length > 1) {
      return nameParts[0].substring(0, 2).toUpperCase();
    }
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return 'NN';
}

export function formatMentionsForDisplay(text: string): string {
  if (!text) return '';
  return text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '<span class="bg-primary/10 text-primary rounded px-1 py-0.5 font-medium">@$1</span>');
}

export function parseMentions(text: string): string[] {
  const mentionRegex = /@\[[^\]]+\]\(([^)]+)\)/g;
  const matches = text.matchAll(mentionRegex);
  return Array.from(matches, match => match[1]);
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength)}...`;
}

export const getProjectStatusStyles = (status: string | null | undefined) => {
  switch (status) {
    case 'Completed':
      return { tw: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', hex: '#22c55e' }; // green-500
    case 'On Track':
    case 'In Progress':
      return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', hex: '#3b82f6' }; // blue-500
    case 'Pending':
    case 'Requested':
      return { tw: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300', hex: '#f59e0b' }; // amber-500
    case 'On Hold':
    case 'Reschedule':
      return { tw: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300', hex: '#f97316' }; // orange-500
    case 'Cancelled':
    case 'Bid Lost':
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', hex: '#6b7280' }; // gray-500
    case 'Billing Process':
      return { tw: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300', hex: '#8b5cf6' }; // violet-500
    default:
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', hex: '#6b7280' };
  }
};

export const getPaymentStatusStyles = (status: string | null | undefined) => {
  switch (status) {
    case 'Paid':
      return { tw: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', hex: '#22c55e' };
    case 'Overdue':
      return { tw: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300', hex: '#ef4444' };
    case 'Partially Paid':
      return { tw: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300', hex: '#f59e0b' };
    case 'Unpaid':
    case 'Pending':
    case 'In Process':
    case 'Requested':
    case 'Invoiced':
    case 'Quo Approved':
    case 'Inv Approved':
    case 'Proposed':
      return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', hex: '#3b82f6' };
    case 'Cancelled':
    case 'Bid Lost':
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', hex: '#6b7280' };
    default:
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', hex: '#6b7280' };
  }
};

export const formatInJakarta = (date: string | Date, formatStr: string) => {
  return formatInTimeZone(date, 'Asia/Jakarta', formatStr);
};

export const formatPhoneNumberForApi = (phone: string): string | null => {
    if (!phone) return null;
    let cleaned = phone.trim().replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      return '62' + cleaned.substring(1);
    }
    if (cleaned.startsWith('62')) {
      return cleaned;
    }
    if (cleaned.length > 8 && cleaned.startsWith('8')) {
      return '62' + cleaned;
    }
    return null;
};

export const getErrorMessage = (error: any, defaultMessage: string = 'An unknown error occurred.'): string => {
  if (typeof error === 'string') return error;
  if (error && typeof error.message === 'string') return error.message;
  return defaultMessage;
};

export const formatBytes = (bytes: number | null | undefined, decimals = 2) => {
  if (bytes === 0 || bytes == null) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const formatTaskText = (text: string, maxLength?: number): string => {
  if (!text) return '';
  let processedText = text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1');
  if (maxLength && processedText.length > maxLength) {
    processedText = `${processedText.substring(0, maxLength)}...`;
  }
  return processedText;
};

export const isOverdue = (dueDateStr: string | null | undefined): boolean => {
  if (!dueDateStr) return false;
  return isPast(new Date(dueDateStr));
};

export const getDueDateClassName = (dueDateStr: string | null | undefined, completed: boolean): string => {
  if (!dueDateStr || completed) {
    return "text-muted-foreground";
  }
  if (isOverdue(dueDateStr)) {
    return "text-destructive font-semibold";
  }
  return "text-muted-foreground";
};

export const getPriorityStyles = (priority: string | null | undefined) => {
  switch (priority) {
    case 'Urgent': return { tw: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' };
    case 'High': return { tw: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' };
    case 'Normal': return { tw: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' };
    case 'Low': return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' };
    default: return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
  }
};

export const getTaskStatusStyles = (status: string | null | undefined) => {
  switch (status) {
    case 'Done':
      return { tw: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' };
    case 'In progress':
      return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' };
    case 'To do':
    default:
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
  }
};

export const formatActivityDescription = (text: string | null | undefined, type?: string | null): string => {
  if (!text) return "";

  // Specific override for VENUE_UPDATED
  if (type === 'VENUE_UPDATED') {
    const venueMatch = text.match(/updated the venue to "(.*)"/s);
    if (venueMatch && venueMatch[1]) {
      const venueText = venueMatch[1].replace(/\n/g, ', ');
      return `updated venue: <strong class="font-semibold text-foreground">${venueText}</strong>`;
    }
  }

  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;

  // General improvement for other activities: remove quotes and bold the value.
  let formattedText = text.replace(/ to "(.*?)"$/, ' to <strong class="font-semibold text-foreground">$1</strong>');

  return formattedText
    .replace(/\\"/g, '"') // Unescape quotes
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    .replace(/`(.*?)`/g, '<code class="bg-muted text-muted-foreground font-mono text-xs px-1 py-0.5 rounded">$1</code>')
    .replace(urlRegex, (url) => {
      const href = url.startsWith('www.') ? `https://${url}` : url;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">${url}</a>`;
    })
    .replace(mentionRegex, '<span class="text-primary font-semibold">@$1</span>');
};