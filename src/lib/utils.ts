import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { TaskPriority, TaskStatus, ProjectStatus, PaymentStatus } from "@/types";
import { isPast } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getInitials = (name?: string | null, fallback = 'NN') => {
  if (!name) return fallback;
  const nameParts = name.trim().split(' ');
  if (nameParts.length > 1 && nameParts[0] && nameParts[nameParts.length - 1]) {
    return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
  }
  if (nameParts[0] && nameParts[0].length > 1) {
    return nameParts[0].substring(0, 2).toUpperCase();
  }
  if (nameParts[0] && nameParts[0].length > 0) {
    return nameParts[0][0].toUpperCase();
  }
  return fallback;
};

export const getAvatarUrl = (avatarUrl: string | null | undefined, seed: string) => {
  if (avatarUrl) return avatarUrl;
  return `https://api.dicebear.com/8.x/micah/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
};

export const generatePastelColor = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return { backgroundColor: `hsl(${h}, 70%, 90%)`, color: `hsl(${h}, 70%, 30%)` };
};

export function getPriorityStyles(priority?: TaskPriority | null) {
  const priorityLower = priority?.toLowerCase();
  switch (priorityLower) {
    case 'urgent':
      return {
        tw: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-700/50',
        hex: '#ef4444', // red-500
      };
    case 'high':
      return {
        tw: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-700/50',
        hex: '#f97316', // orange-500
      };
    case 'normal':
      return {
        tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-700/50',
        hex: '#3b82f6', // blue-500
      };
    case 'low':
      return {
        tw: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300 border-sky-200 dark:border-sky-700/50',
        hex: '#0ea5e9', // sky-500
      };
    default:
      return {
        tw: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
        hex: '#6b7280', // gray-500
      };
  }
}

export function getTaskStatusStyles(status?: TaskStatus | null) {
  switch (status) {
    case 'To do':
      return { tw: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300', hex: '#0ea5e9' };
    case 'In progress':
      return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', hex: '#3b82f6' };
    case 'In review':
      return { tw: 'bg-purple-200 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300', hex: '#8b5cf6' };
    case 'Done':
      return { tw: 'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300', hex: '#22c55e' };
    default:
      return { tw: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200', hex: '#9ca3af' };
  }
}

export function getProjectStatusStyles(status?: ProjectStatus | null) {
  switch (status) {
    case 'On Track':
    case 'In Progress':
      return {
        tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-700/50',
        hex: '#3b82f6', // blue-500
      };
    case 'Completed':
      return {
        tw: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-700/50',
        hex: '#22c55e', // green-500
      };
    case 'At Risk':
      return {
        tw: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-700/50',
        hex: '#f97316', // orange-500
      };
    case 'Off Track':
      return {
        tw: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-700/50',
        hex: '#ef4444', // red-500
      };
    case 'On Hold':
    case 'Reschedule':
      return {
        tw: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-700/50',
        hex: '#f59e0b', // amber-500
      };
    case 'Billing Process':
      return {
        tw: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-700/50',
        hex: '#8b5cf6', // purple-500
      };
    case 'Pending':
    case 'Requested':
    case 'Planning':
    case 'Archived':
    case 'Cancelled':
    case 'Bid Lost':
    default:
      return {
        tw: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600',
        hex: '#64748b', // slate-500
      };
  }
}

export function getPaymentStatusStyles(status?: PaymentStatus | null) {
  switch (status) {
    case 'Paid':
      return {
        tw: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-700/50',
        hex: '#22c55e', // green-500
      };
    case 'Overdue':
      return {
        tw: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-700/50',
        hex: '#ef4444', // red-500
      };
    case 'Partially Paid':
      return {
        tw: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-700/50',
        hex: '#f97316', // orange-500
      };
    case 'Unpaid':
      return {
        tw: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-700/50',
        hex: '#f59e0b', // amber-500
      };
    case 'Pending':
    case 'In Process':
      return {
        tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-700/50',
        hex: '#3b82f6', // blue-500
      };
    case 'Invoiced':
      return {
        tw: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-700/50',
        hex: '#8b5cf6', // purple-500
      };
    case 'Quo Approved':
      return {
        tw: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 border-teal-200 dark:border-teal-700/50',
        hex: '#14b8a6', // teal-500
      };
    case 'Inv Approved':
      return {
        tw: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700/50',
        hex: '#06b6d4', // cyan-500
      };
    case 'Proposed':
    case 'Requested':
    case 'Cancelled':
    case 'Bid Lost':
    default:
      return {
        tw: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600',
        hex: '#64748b', // slate-500
      };
  }
}

export function truncateText(text: string, maxLength: number) {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}

export const formatInJakarta = (date: string | Date, formatString: string) => {
  return formatInTimeZone(new Date(date), 'Asia/Jakarta', formatString);
};

export const isOverdue = (dueDate: string | null | undefined): boolean => {
  if (!dueDate) return false;
  return isPast(new Date(dueDate));
};

export const getDueDateClassName = (dueDate: string | null | undefined, completed: boolean): string => {
  if (completed || !dueDate) return 'text-muted-foreground';
  if (isOverdue(dueDate)) return 'text-destructive font-semibold';
  return 'text-muted-foreground';
};

export const formatBytes = (bytes: number | null | undefined, decimals = 2) => {
  if (bytes === 0 || bytes == null) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const getErrorMessage = (error: any, defaultMessage = "An unexpected error occurred."): string => {
  if (!error) return defaultMessage;
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.error_description) return error.error_description;
  try {
    return JSON.stringify(error);
  } catch {
    return defaultMessage;
  }
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
    return cleaned; // Fallback for other formats
};