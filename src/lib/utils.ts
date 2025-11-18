import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { isPast, isToday, isTomorrow } from 'date-fns';
import { TaskPriority, ProjectStatus, PaymentStatus, TaskStatus } from "@/types";
import { format as formatTz, toZonedTime } from 'date-fns-tz';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

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

export function generatePastelColor(seed: string): React.CSSProperties {
  if (!seed) return { backgroundColor: '#e5e7eb' }; // gray-200
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return { backgroundColor: `hsl(${h}, 70%, 80%)` };
}

export function getAvatarUrl(avatarUrl: string | null | undefined, seed: string): string {
  if (avatarUrl && avatarUrl.startsWith('http')) {
    return avatarUrl;
  }
  return `https://api.dicebear.com/8.x/micah/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

export const formatPhoneNumberForApi = (phone: string | undefined | null): string | null => {
    if (!phone) return null;
    let cleaned = phone.trim().replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      return '62' + cleaned.substring(1);
    }
    if (cleaned.length > 8 && cleaned.startsWith('8')) {
      return '62' + cleaned;
    }
    if (cleaned.startsWith('62')) {
      return cleaned;
    }
    return cleaned;
};

export const isOverdue = (dueDate: string | null | undefined): boolean => {
  if (!dueDate) return false;
  return isPast(new Date(dueDate));
};

export const getPriorityStyles = (priority: TaskPriority | null | undefined) => {
  switch (priority) {
    case 'Urgent': return { tw: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-700/50', hex: '#ef4444' };
    case 'High': return { tw: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-700/50', hex: '#f97316' };
    case 'Normal': return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-700/50', hex: '#3b82f6' };
    case 'Low': return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600', hex: '#6b7280' };
    default: return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600', hex: '#6b7280' };
  }
};

export const getTaskStatusStyles = (status: TaskStatus | null | undefined) => {
  switch (status) {
    case 'To do': return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600', hex: '#6b7280' };
    case 'In progress': return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-700/50', hex: '#3b82f6' };
    case 'In review': return { tw: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-700/50', hex: '#8b5cf6' };
    case 'Done': return { tw: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-700/50', hex: '#22c55e' };
    default: return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600', hex: '#6b7280' };
  }
};

export const getDueDateClassName = (dueDate: string | null | undefined, completed: boolean): string => {
  if (completed) return 'text-muted-foreground';
  if (!dueDate) return 'text-muted-foreground';
  const date = new Date(dueDate);
  if (isPast(date)) return 'text-destructive font-semibold';
  if (isToday(date)) return 'text-orange-500 font-semibold';
  if (isTomorrow(date)) return 'text-yellow-500';
  return 'text-muted-foreground';
};

export const getProjectStatusStyles = (status: ProjectStatus | string | null | undefined) => {
  switch (status) {
    case 'On Track': return { tw: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-700/50', hex: '#22c55e' };
    case 'At Risk': return { tw: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700/50', hex: '#f59e0b' };
    case 'Off Track': return { tw: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-700/50', hex: '#ef4444' };
    case 'On Hold': return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600', hex: '#6b7280' };
    case 'Completed': return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-700/50', hex: '#3b82f6' };
    default: return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600', hex: '#6b7280' };
  }
};

export const getPaymentStatusStyles = (status: PaymentStatus | string | null | undefined) => {
  switch (status) {
    case 'Paid': return { tw: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-700/50', hex: '#22c55e' };
    case 'Unpaid': return { tw: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700/50', hex: '#f59e0b' };
    case 'Overdue': return { tw: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-700/50', hex: '#ef4444' };
    case 'Pending': return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-700/50', hex: '#3b82f6' };
    default: return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600', hex: '#6b7280' };
  }
};

export const getErrorMessage = (error: any, defaultMessage: string = "An unexpected error occurred."): string => {
  if (!error) return defaultMessage;
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.error_description) return error.error_description;
  return defaultMessage;
};

export const formatInJakarta = (date: string | Date, formatString: string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const timeZone = 'Asia/Jakarta';
  const zonedDate = toZonedTime(dateObj, timeZone);
  return formatTz(zonedDate, formatString, { timeZone });
};