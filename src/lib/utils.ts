import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { isSameDay, subDays, isPast as isPastDate } from 'date-fns';
import { colors } from "@/data/colors";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getAvatarUrl = (avatarUrl: string | null | undefined, seed?: string): string => {
  if (avatarUrl) {
    return avatarUrl;
  }
  
  const effectiveSeed = seed || 'default-seed';
  // Logika sederhana untuk memilih gaya avatar secara bervariasi berdasarkan seed
  const style = (parseInt(effectiveSeed.slice(-1), 16) % 2 === 0) ? 'lorelei' : 'micah';
  const backgroundColorPalette = 'b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf';

  return `https://api.dicebear.com/8.x/${style}/svg?seed=${effectiveSeed}&backgroundColor=${backgroundColorPalette}`;
};

export const generatePastelColor = (seed: string) => {
  if (!seed) {
    return { backgroundColor: `hsl(200, 70%, 85%)` };
  }
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return { backgroundColor: `hsl(${h}, 70%, 85%)` };
};

export const formatInJakarta = (date: string | Date, formatString: string) => {
  return format(new Date(date), formatString, { locale: id });
};

export const getProjectStatusStyles = (status: string) => {
  switch (status) {
    case 'Completed':
    case 'Done':
    case 'On Track':
      return { tw: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', hex: '#22c55e', bgHexLight: '#dcfce7', bgHexDark: '#16a34a' };
    case 'In Progress':
    case 'In Review':
      return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', hex: '#3b82f6', bgHexLight: '#dbeafe', bgHexDark: '#2563eb' };
    case 'At Risk':
    case 'On Hold':
      return { tw: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300', hex: '#f59e0b', bgHexLight: '#fef9c3', bgHexDark: '#ca8a04' };
    case 'Off Track':
    case 'Cancelled':
      return { tw: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300', hex: '#ef4444', bgHexLight: '#fee2e2', bgHexDark: '#dc2626' };
    case 'Requested':
    case 'Idea':
    default:
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', hex: '#6b7280', bgHexLight: '#f3f4f6', bgHexDark: '#4b5563' };
  }
};

export const getPaymentStatusStyles = (status: string) => {
  switch (status) {
    case 'Paid':
      return { tw: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', hex: '#22c55e', bgHexLight: '#dcfce7', bgHexDark: '#16a34a' };
    case 'Overdue':
      return { tw: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300', hex: '#ef4444', bgHexLight: '#fee2e2', bgHexDark: '#dc2626' };
    case 'Due':
    case 'Unpaid':
      return { tw: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300', hex: '#f59e0b', bgHexLight: '#fef9c3', bgHexDark: '#ca8a04' };
    case 'Pending':
    case 'In Process':
      return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', hex: '#3b82f6', bgHexLight: '#dbeafe', bgHexDark: '#2563eb' };
    case 'Proposed':
      return { tw: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300', hex: '#8b5cf6', bgHexLight: '#ede9fe', bgHexDark: '#7c3aed' };
    case 'Cancelled':
    default:
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', hex: '#6b7280', bgHexLight: '#f3f4f6', bgHexDark: '#4b5563' };
  }
};

export const getTaskStatusStyles = (status: string) => {
  switch (status) {
    case 'Done':
      return { tw: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' };
    case 'In Progress':
      return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' };
    case 'Cancelled':
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
    case 'To do':
    default:
      return { tw: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' };
  }
};

export const getPriorityStyles = (priority: string | null | undefined) => {
  switch (priority) {
    case 'Urgent':
      return { tw: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300', hex: '#ef4444' };
    case 'High':
      return { tw: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300', hex: '#f97316' };
    case 'Normal':
      return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', hex: '#3b82f6' };
    case 'Low':
    default:
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', hex: '#6b7280' };
  }
};

export const getInitials = (name?: string | null, email?: string | null): string => {
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
};

export const formatTaskText = (text: string | null | undefined, maxLength?: number): string => {
  if (!text) return '';
  let processedText = text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1');
  if (maxLength && processedText.length > maxLength) {
    return processedText.substring(0, maxLength) + '...';
  }
  return processedText;
};

export const isOverdue = (dueDate: string | null): boolean => {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day
  return new Date(dueDate) < today;
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

export const getColorForTag = (tagName: string): string => {
  if (!tagName) {
    return colors[0];
  }
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % colors.length);
  return colors[index];
};