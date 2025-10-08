import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNowStrict, format as formatDate, isBefore, startOfToday } from 'date-fns';
import { id } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(date: string | Date): string {
  return formatDistanceToNowStrict(new Date(date), { addSuffix: true });
}

export const getProjectStatusStyles = (status: string) => {
  switch (status) {
    case 'Requested':
      return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', hex: '#3B82F6' };
    case 'In Progress':
    case 'On Track':
      return { tw: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300', hex: '#14B8A6' };
    case 'In Review':
      return { tw: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300', hex: '#8B5CF6' };
    case 'On Hold':
    case 'At Risk':
      return { tw: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300', hex: '#F97316' };
    case 'Completed':
      return { tw: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', hex: '#22C55E' };
    case 'Cancelled':
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300', hex: '#6B7280' };
    case 'Off Track':
      return { tw: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300', hex: '#EF4444' };
    default:
      return { tw: 'bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300', hex: '#CBD5E0' };
  }
};

export const getPaymentStatusStyles = (status: string) => {
  switch (status) {
    case 'Paid':
      return { tw: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', hex: '#22C55E' };
    case 'Unpaid':
      return { tw: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300', hex: '#FBBF24' };
    case 'Pending':
      return { tw: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300', hex: '#F97316' };
    case 'Overdue':
      return { tw: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300', hex: '#EF4444' };
    case 'In Process':
      return { tw: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300', hex: '#8B5CF6' };
    case 'Proposed':
      return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', hex: '#3B82F6' };
    case 'Cancelled':
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300', hex: '#6B7280' };
    default:
      return { tw: 'bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300', hex: '#CBD5E0' };
  }
};

export const getInitials = (name?: string | null, email?: string | null): string => {
  if (name) {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    if (parts.length === 1 && parts[0]) {
      return parts[0].substring(0, 2).toUpperCase();
    }
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return 'NN';
};

export const generatePastelColor = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return { backgroundColor: `hsl(${h}, 70%, 85%)`, color: `hsl(${h}, 70%, 30%)` };
};

export const getAvatarUrl = (avatarUrl?: string | null, seed?: string | null): string | undefined => {
  if (avatarUrl) return avatarUrl;
  if (seed) return `https://api.dicebear.com/8.x/initials/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&fontWeight=600`;
  return undefined;
};

export const formatInJakarta = (date: string | Date, formatString: string = 'dd MMM yyyy, HH:mm'): string => {
  if (!date) return '';
  try {
    return formatDate(new Date(date), formatString, { locale: id });
  } catch (error) {
    console.error("Invalid date for formatting:", date);
    return "Invalid date";
  }
};

export const getPriorityStyles = (priority: string) => {
  switch (priority) {
    case 'Low':
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300', hex: '#A0AEC0' };
    case 'Normal':
      return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', hex: '#63B3ED' };
    case 'High':
      return { tw: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300', hex: '#F6E05E' };
    case 'Urgent':
      return { tw: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300', hex: '#FC8181' };
    default:
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300', hex: '#A0AEC0' };
  }
};

export const getTaskStatusStyles = (status: string) => {
  switch (status) {
    case 'To do':
      return { tw: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300', hex: '#FBBF24' };
    case 'In Progress':
      return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', hex: '#3B82F6' };
    case 'Done':
      return { tw: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', hex: '#22C55E' };
    case 'Cancelled':
      return { tw: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300', hex: '#EF4444' };
    default:
      return { tw: 'bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300', hex: '#CBD5E0' };
  }
};

export const isOverdue = (date: string | Date | null): boolean => {
  if (!date) return false;
  try {
    return isBefore(new Date(date), startOfToday());
  } catch (error) {
    return false;
  }
};

export const formatPhoneNumberForApi = (phone: string): string => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  return cleaned;
};

export const getColorForTag = (tag: string): string => {
  let hash = 0;
  if (!tag || tag.length === 0) {
    return `hsl(0, 0%, 85%)`;
  }
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 80%)`;
};

export const formatTaskText = (text: string | null | undefined, truncateLength?: number): string => {
  if (!text) return '';
  let processedText = text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1');
  if (truncateLength && processedText.length > truncateLength) {
    return processedText.substring(0, truncateLength) + '...';
  }
  return processedText;
};