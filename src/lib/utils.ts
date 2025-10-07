import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { isPast, startOfToday, isSameDay, format } from 'date-fns';
import { id } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getPaymentStatusStyles = (status: string) => {
  switch (status) {
    case 'Paid':
      return { tw: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', hex: '#22c55e' };
    case 'Overdue':
      return { tw: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', hex: '#ef4444' };
    case 'Pending':
    case 'In Process':
      return { tw: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', hex: '#eab308' };
    case 'Unpaid':
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', hex: '#6b7280' };
    case 'Cancelled':
      return { tw: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400', hex: '#6b7280' };
    default:
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', hex: '#6b7280' };
  }
};

export const getAvatarUrl = (avatarUrl: string | null | undefined, seed: string): string => {
  if (avatarUrl && avatarUrl.trim() !== '') {
    return avatarUrl;
  }
  return `https://api.dicebear.com/8.x/initials/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&fontWeight=600`;
};

export const generatePastelColor = (seed: string): { backgroundColor: string } => {
  if (!seed) {
    return { backgroundColor: 'hsl(200, 70%, 80%)' };
  }
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return { backgroundColor: `hsl(${h}, 70%, 80%)` };
};

export const getStatusStyles = (status: string) => {
  switch (status) {
    case 'On Track':
      return { tw: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', hex: '#22c55e' };
    case 'At Risk':
      return { tw: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', hex: '#eab308' };
    case 'Off Track':
      return { tw: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', hex: '#ef4444' };
    case 'Completed':
      return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', hex: '#3b82f6' };
    case 'On Hold':
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', hex: '#6b7280' };
    default:
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', hex: '#6b7280' };
  }
};

export const formatInJakarta = (date: Date | string | number, formatStr: string): string => {
  return format(new Date(date), formatStr, { locale: id });
};

export const getPriorityStyles = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return { tw: 'text-red-500', name: 'High', hex: '#ef4444' };
    case 'medium':
      return { tw: 'text-yellow-500', name: 'Medium', hex: '#eab308' };
    case 'low':
      return { tw: 'text-green-500', name: 'Low', hex: '#22c55e' };
    default:
      return { tw: 'text-gray-500', name: 'Normal', hex: '#6b7280' };
  }
};

export const getTaskStatusStyles = (status: string) => {
  switch (status) {
    case 'To do':
      return { tw: 'bg-gray-200 text-gray-800' };
    case 'In progress':
      return { tw: 'bg-blue-200 text-blue-800' };
    case 'Done':
      return { tw: 'bg-green-200 text-green-800' };
    case 'Backlog':
      return { tw: 'bg-yellow-200 text-yellow-800' };
    default:
      return { tw: 'bg-gray-200 text-gray-800' };
  }
};

export const isOverdue = (dueDate: Date | string | null): boolean => {
  if (!dueDate) return false;
  const date = new Date(dueDate);
  return isPast(date) && !isSameDay(date, startOfToday());
};

export const getInitials = (name?: string | null, email?: string | null): string => {
  if (name && name.trim()) {
    const names = name.trim().split(' ').filter(Boolean);
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0]?.substring(0, 2).toUpperCase() || '??';
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return '??';
};

export const formatPhoneNumberForApi = (phone: string): string => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
};

export const getColorForTag = (tagName: string): string => {
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 90%, 65%)`;
};