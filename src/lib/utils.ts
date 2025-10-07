import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format as formatTz, toZonedTime } from 'date-fns-tz';
import { isToday } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getStatusStyles = (status: string) => {
  const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full inline-block';
  switch (status) {
    case 'On Track':
      return {
        className: `${baseClasses} bg-green-100 text-green-800`,
        hex: '#22c55e', // Vibrant Green
      };
    case 'At Risk':
      return {
        className: `${baseClasses} bg-yellow-100 text-yellow-800`,
        hex: '#f97316', // Vibrant Orange
      };
    case 'Off Track':
      return {
        className: `${baseClasses} bg-red-100 text-red-800`,
        hex: '#ef4444', // Vibrant Red
      };
    case 'Completed':
      return {
        className: `${baseClasses} bg-blue-100 text-blue-800`,
        hex: '#3b82f6', // Vibrant Blue
      };
    case 'On Hold':
      return {
        className: `${baseClasses} bg-gray-100 text-gray-800`,
        hex: '#6b7280', // Vibrant Gray
      };
    case 'Cancelled':
      return {
        className: `${baseClasses} bg-gray-200 text-gray-600`,
        hex: '#111827', // Dark Gray
      };
    case 'Planning':
      return {
        className: `${baseClasses} bg-purple-100 text-purple-800`,
        hex: '#a855f7', // Vibrant Purple
      };
    default:
      return {
        className: `${baseClasses} bg-gray-100 text-gray-800`,
        hex: '#9ca3af', // Muted Gray
      };
  }
};

export const getPaymentStatusStyles = (status: string) => {
  const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full inline-block';
  switch (status) {
    case 'Paid':
      return {
        className: `${baseClasses} bg-green-100 text-green-800`,
        hex: '#22c55e', // Vibrant Green
      };
    case 'Unpaid':
      return {
        className: `${baseClasses} bg-red-100 text-red-800`,
        hex: '#ef4444', // Vibrant Red
      };
    case 'Partially Paid':
      return {
        className: `${baseClasses} bg-yellow-100 text-yellow-800`,
        hex: '#f59e0b', // Vibrant Amber
      };
    case 'Overdue':
      return {
        className: `${baseClasses} bg-red-200 text-red-900`,
        hex: '#dc2626', // Darker Red
      };
    case 'Processing':
      return {
        className: `${baseClasses} bg-blue-100 text-blue-800`,
        hex: '#3b82f6', // Vibrant Blue
      };
    case 'Refunded':
      return {
        className: `${baseClasses} bg-gray-200 text-gray-600`,
        hex: '#6b7280', // Vibrant Gray
      };
    default:
      return {
        className: `${baseClasses} bg-gray-100 text-gray-800`,
        hex: '#9ca3af', // Muted Gray
      };
  }
};

export const generatePastelColor = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return { backgroundColor: `hsl(${h}, 50%, 85%)` };
};

export const getInitials = (name?: string | null): string => {
  if (!name) return 'NN';
  const names = name.trim().split(' ');
  if (names.length > 1) {
    const first = names[0][0];
    const last = names[names.length - 1][0];
    if (first && last) {
      return `${first}${last}`.toUpperCase();
    }
  }
  if (names[0] && names[0].length > 1) {
    return names[0].substring(0, 2).toUpperCase();
  }
  return 'NN';
};

export const getAvatarUrl = (item: { id: string, avatar_url?: string | null } | null | undefined): string => {
  const seed = item?.id || 'default-seed';
  if (item?.avatar_url) {
    return item.avatar_url;
  }
  return `https://api.dicebear.com/8.x/initials/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&fontWeight=600`;
};

export const formatInJakarta = (date: string | Date | null | undefined, formatString: string): string => {
  if (!date) return '';
  try {
    const zonedDate = toZonedTime(new Date(date), 'Asia/Jakarta');
    return formatTz(zonedDate, formatString, { timeZone: 'Asia/Jakarta' });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
};

export const getPriorityStyles = (priority: string | null | undefined) => {
  const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full inline-block';
  switch (priority?.toLowerCase()) {
    case 'low':
      return { className: `${baseClasses} bg-gray-100 text-gray-800`, hex: '#6b7280' };
    case 'normal':
      return { className: `${baseClasses} bg-blue-100 text-blue-800`, hex: '#3b82f6' };
    case 'high':
      return { className: `${baseClasses} bg-yellow-100 text-yellow-800`, hex: '#f97316' };
    case 'urgent':
      return { className: `${baseClasses} bg-red-100 text-red-800`, hex: '#ef4444' };
    default:
      return { className: `${baseClasses} bg-gray-100 text-gray-800`, hex: '#9ca3af' };
  }
};

export const isOverdue = (date: string | Date | null | undefined): boolean => {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  // Set time to 0 to compare dates only
  d.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return d < now;
};

export const formatPhoneNumberForApi = (phone: string | undefined): string => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
};

const TAG_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e'
];

export const getColorForTag = (tagName: string): string => {
  if (!tagName) return TAG_COLORS[0];
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % TAG_COLORS.length);
  return TAG_COLORS[index];
};