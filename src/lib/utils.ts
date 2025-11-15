import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { TaskStatus, ProjectStatus, PaymentStatus } from "@/types";
import { isPast } from "date-fns";
import { formatInTimeZone } from 'date-fns-tz';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPriorityStyles(priority: string | null | undefined) {
  const normalizedPriority = priority?.trim().toLowerCase();
  switch (normalizedPriority) {
    case 'urgent':
      return { tw: 'bg-red-200 text-red-900 border-red-300 dark:bg-red-900/60 dark:text-red-100 dark:border-red-700', hex: '#b91c1c', borderColor: 'border-red-700' };
    case 'high':
      return { tw: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-200 dark:border-red-800', hex: '#ef4444', borderColor: 'border-red-500' };
    case 'normal':
      return { tw: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-200 dark:border-yellow-800', hex: '#f59e0b', borderColor: 'border-yellow-500' };
    case 'low':
      return { tw: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600', hex: '#6b7280', borderColor: 'border-gray-400' };
    default:
      return { tw: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600', hex: '#6b7280', borderColor: 'border-transparent' };
  }
}

export function getTaskStatusStyles(status: TaskStatus) {
  switch (status) {
    case 'To do':
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', hex: '#6b7280' };
    case 'In progress':
      return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200', hex: '#3b82f6' };
    case 'In review':
      return { tw: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200', hex: '#8b5cf6' };
    case 'Done':
      return { tw: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200', hex: '#22c55e' };
    default:
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', hex: '#6b7280' };
  }
}

export function getProjectStatusStyles(status: ProjectStatus) {
  switch (status) {
    case 'On Track':
    case 'Completed':
      return { tw: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200', hex: '#22c55e' };
    case 'At Risk':
      return { tw: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200', hex: '#f59e0b' };
    case 'Off Track':
      return { tw: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200', hex: '#ef4444' };
    case 'On Hold':
      return { tw: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200', hex: '#f97316' };
    case 'Archived':
    case 'Cancelled':
    case 'Bid Lost':
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', hex: '#6b7280' };
    case 'Billing Process':
    case 'In Progress':
    case 'Pending':
    case 'Requested':
    case 'Planning':
    case 'Reschedule':
    default:
      return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200', hex: '#3b82f6' };
  }
}

export function getPaymentStatusStyles(status: PaymentStatus) {
  switch (status) {
    case 'Paid':
      return { tw: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200', hex: '#22c55e' };
    case 'Overdue':
      return { tw: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200', hex: '#ef4444' };
    case 'Partially Paid':
      return { tw: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200', hex: '#f97316' };
    case 'Unpaid':
      return { tw: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200', hex: '#f59e0b' };
    case 'Pending':
    case 'In Process':
    case 'Requested':
    case 'Invoiced':
      return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200', hex: '#3b82f6' };
    case 'Quo Approved':
    case 'Inv Approved':
      return { tw: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200', hex: '#8b5cf6' };
    case 'Proposed':
    case 'Cancelled':
    case 'Bid Lost':
    default:
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', hex: '#6b7280' };
  }
}

export function isOverdue(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;
  const date = new Date(dueDate);
  if (isNaN(date.getTime())) {
    return false;
  }
  return isPast(date);
}

export function generatePastelColor(str: string): { backgroundColor: string; color: string } {
    if (!str) {
        const h = Math.floor(Math.random() * 360);
        const s = 75;
        const l = 80;
        const backgroundColor = `hsl(${h}, ${s}%, ${l}%)`;
        const textColor = l > 60 ? 'hsl(0, 0%, 10%)' : 'hsl(0, 0%, 90%)';
        return { backgroundColor, color: textColor };
    }
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    const s = 75;
    const l = 80;
    const backgroundColor = `hsl(${h}, ${s}%, ${l}%)`;
    const textColor = l > 60 ? 'hsl(0, 0%, 10%)' : 'hsl(0, 0%, 90%)';
    return { backgroundColor, color: textColor };
}

export function getInitials(name?: string, fallbackEmail?: string): string {
  if (name && name.trim()) {
    const nameParts = name.trim().split(' ');
    if (nameParts.length > 1 && nameParts[nameParts.length - 1]) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    if (nameParts[0] && nameParts[0].length > 1) {
      return nameParts[0].substring(0, 2).toUpperCase();
    }
    if (nameParts[0] && nameParts[0].length > 0) {
      return nameParts[0][0].toUpperCase();
    }
  }
  if (fallbackEmail) {
    return fallbackEmail.substring(0, 2).toUpperCase();
  }
  return 'NN';
}

export function getAvatarUrl(avatarUrl: string | null | undefined, seed: string): string {
  if (avatarUrl) {
    return avatarUrl;
  }
  return `https://api.dicebear.com/8.x/micah/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

export const formatInJakarta = (date: string | Date, formatString: string) => {
  return formatInTimeZone(date, 'Asia/Jakarta', formatString);
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
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return defaultMessage;
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

export const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
};

export function getDueDateClassName(dueDate: string | null | undefined, isCompleted: boolean): string {
  if (isCompleted) {
    return 'text-muted-foreground';
  }
  if (isOverdue(dueDate)) {
    return 'text-destructive font-semibold';
  }
  return 'text-muted-foreground';
}