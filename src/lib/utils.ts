import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format as formatDateFns, toZonedTime } from 'date-fns-tz';
import { isBefore, startOfToday } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name?: string, fallback?: string): string {
  if (!name && !fallback) return 'NN';
  const targetName = name || fallback || '';
  if (targetName.includes(' ')) {
    const parts = targetName.split(' ').filter(p => p.length > 0);
    const first = parts[0] ? parts[0][0] : '';
    const last = parts.length > 1 && parts[parts.length - 1] ? parts[parts.length - 1][0] : '';
    return `${first}${last}`.toUpperCase();
  }
  return targetName.substring(0, 2).toUpperCase();
}

export function generatePastelColor(seed: string): React.CSSProperties {
  let hash = 0;
  if (seed) {
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  const h = hash % 360;
  return { backgroundColor: `hsl(${h}, 70%, 80%)` };
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export const getAvatarUrl = (avatarUrl: string | null | undefined, seed: string): string => {
  if (avatarUrl) {
    try {
      const url = new URL(avatarUrl);
      url.searchParams.delete('t');
      return `${url.toString()}?t=${new Date().getTime()}`;
    } catch (e) {
      // Invalid URL, fallback to DiceBear
    }
  }
  
  let hash = 0;
  if (seed) {
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  const avatarStyle = (hash % 2 === 0) ? 'lorelei' : 'micah';
  
  return `https://api.dicebear.com/8.x/${avatarStyle}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
};

export const formatInJakarta = (date: string | Date, formatString: string): string => {
  const timeZone = 'Asia/Jakarta';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const zonedDate = toZonedTime(dateObj, timeZone);
  return formatDateFns(zonedDate, formatString, { timeZone });
};

export const formatPhoneNumberForApi = (phone: string): string => {
  if (!phone) return '';
  let cleaned = String(phone).trim().replace(/\D/g, '');
  
  if (cleaned.startsWith('62')) {
    return cleaned;
  }
  if (cleaned.startsWith('0')) {
    return '62' + cleaned.substring(1);
  }
  if (cleaned.length > 8 && cleaned.startsWith('8')) {
    return '62' + cleaned;
  }
  return cleaned;
};

export const getProjectStatusStyles = (status: string) => {
  switch (status) {
    case 'On Track':
    case 'Completed':
      return { tw: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', hex: '#22c55e' };
    case 'In Progress':
    case 'In Review':
      return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', hex: '#3b82f6' };
    case 'On Hold':
      return { tw: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', hex: '#f59e0b' };
    case 'At Risk':
    case 'Off Track':
      return { tw: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', hex: '#ef4444' };
    case 'Cancelled':
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', hex: '#6b7280' };
    default:
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', hex: '#6b7280' };
  }
};

export const getPaymentStatusStyles = (status: string) => {
  switch (status) {
    case 'Paid':
      return { tw: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', hex: '#22c55e' };
    case 'Unpaid':
    case 'Pending':
    case 'In Process':
      return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', hex: '#3b82f6' };
    case 'Overdue':
      return { tw: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', hex: '#ef4444' };
    case 'Proposed':
      return { tw: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', hex: '#f59e0b' };
    case 'Cancelled':
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', hex: '#6b7280' };
    default:
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', hex: '#6b7280' };
  }
};

export const getTaskStatusStyles = (status: string) => {
  switch (status) {
    case 'Done':
      return { tw: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' };
    case 'In Progress':
      return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' };
    case 'To do':
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' };
    case 'Cancelled':
      return { tw: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' };
    default:
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' };
  }
};

export const getPriorityStyles = (priority: string) => {
  switch (priority) {
    case 'Urgent':
      return { tw: 'text-red-600 bg-red-100', hex: '#dc2626' };
    case 'High':
      return { tw: 'text-orange-600 bg-orange-100', hex: '#ea580c' };
    case 'Normal':
      return { tw: 'text-blue-600 bg-blue-100', hex: '#2563eb' };
    case 'Low':
      return { tw: 'text-gray-600 bg-gray-100', hex: '#4b5563' };
    default:
      return { tw: 'text-gray-600 bg-gray-100', hex: '#4b5563' };
  }
};

export const isOverdue = (dueDate: string) => {
  if (!dueDate) return false;
  return isBefore(new Date(dueDate), startOfToday());
};

export const formatTaskText = (text: string | null | undefined, maxLength?: number) => {
  if (!text) return '';
  let processedText = text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1');
  if (maxLength && processedText.length > maxLength) {
    return processedText.substring(0, maxLength) + '...';
  }
  return processedText;
};