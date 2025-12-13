import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatInTimeZone } from "date-fns-tz";
import { isPast, isToday } from 'date-fns';
import { TaskPriority, ProjectStatus, PaymentStatus, TaskStatus } from "@/types";

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

export const getInitials = (name?: string | null, fallback?: string | null): string => {
  if (!name && !fallback) return 'NN';
  const targetName = name || fallback || '';
  
  const nameParts = targetName.split(' ');
  if (nameParts.length > 1 && nameParts[0] && nameParts[nameParts.length - 1]) {
    return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
  }
  if (targetName.length > 1) {
    return targetName.substring(0, 2).toUpperCase();
  }
  return 'NN';
};

export const generatePastelColor = (seed: string | null | undefined): React.CSSProperties => {
  if (!seed) return { backgroundColor: '#e2e8f0' }; // slate-200
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return { backgroundColor: `hsl(${h}, 70%, 85%)` };
};

export const getAvatarUrl = (url: string | null | undefined, seed: string | null | undefined): string | undefined => {
  if (url) return url;
  if (seed) {
    return `https://api.dicebear.com/8.x/micah/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  }
  return undefined;
};

export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error && typeof error.message === 'string') return error.message;
  return 'An unknown error occurred.';
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const formatPhoneNumberForApi = (phone: string): string => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
};

export const isOverdue = (dueDate: string | Date | null | undefined): boolean => {
  if (!dueDate) return false;
  const date = new Date(dueDate);
  return isPast(date) && !isToday(date);
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
    case 'Done': return { tw: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-700/50' };
    case 'In progress': return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-700/50' };
    case 'In review': return { tw: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-700/50' };
    case 'To do': return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600' };
    default: return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600' };
  }
};

export const getProjectStatusStyles = (status: ProjectStatus | null | undefined) => {
  switch (status) {
    case 'Completed': return { tw: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-700/50', hex: '#22c55e' };
    case 'On Track': return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-700/50', hex: '#3b82f6' };
    case 'At Risk': return { tw: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700/50', hex: '#eab308' };
    case 'Off Track': return { tw: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-700/50', hex: '#f97316' };
    case 'On Hold': return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600', hex: '#6b7280' };
    case 'Cancelled': return { tw: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-700/50', hex: '#ef4444' };
    default: return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600', hex: '#6b7280' };
  }
};

export const getPaymentStatusStyles = (status: PaymentStatus | null | undefined) => {
  switch (status) {
    case 'Paid': return { tw: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-700/50' };
    case 'Overdue': return { tw: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-700/50' };
    case 'Pending': return { tw: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700/50' };
    default: return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600' };
  }
};

export const getDueDateClassName = (dueDate: string | Date | null | undefined, completed: boolean | null | undefined) => {
  if (completed) return 'text-muted-foreground';
  if (isOverdue(dueDate)) return 'text-destructive font-semibold';
  return 'text-muted-foreground';
};