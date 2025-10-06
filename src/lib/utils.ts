import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format as formatFns, toZonedTime } from 'date-fns-tz';
import { isPast as isPastFns, isSameDay } from 'date-fns';
import { ProjectStatus, PaymentStatus, TaskPriority, TaskStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const jakartaTimeZone = 'Asia/Jakarta';

export const formatInJakarta = (date: string | Date, formatString: string): string => {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const zonedDate = toZonedTime(dateObj, jakartaTimeZone);
    return formatFns(zonedDate, formatString, { timeZone: jakartaTimeZone });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
};

export const getInitials = (name?: string | null, email?: string | null): string => {
  if (name) {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    if (parts.length === 1 && parts[0].length > 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return 'NN';
};

export const getAvatarUrl = (
  avatarUrl: string | null | undefined,
  seed: string,
  isGroup: boolean = false
): string => {
  if (typeof avatarUrl === 'string' && avatarUrl.startsWith('http')) {
    return avatarUrl;
  }
  const style = isGroup ? 'bottts' : 'micah';
  return `https://api.dicebear.com/8.x/${style}/svg?seed=${seed || 'default-seed'}`;
};

export const generatePastelColor = (str: string): { backgroundColor: string, color: string } => {
  if (!str) {
    const h = 0; // default hue
    return {
      backgroundColor: `hsl(${h}, 70%, 85%)`,
      color: `hsl(${h}, 70%, 30%)`,
    };
  }
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return {
    backgroundColor: `hsl(${h}, 70%, 85%)`,
    color: `hsl(${h}, 70%, 30%)`,
  };
};

export const getStatusStyles = (status: ProjectStatus | string) => {
  switch (status) {
    case 'Requested': return { hex: '#3b82f6', tw: 'bg-blue-100 text-blue-800' };
    case 'In Progress': return { hex: '#f97316', tw: 'bg-orange-100 text-orange-800' };
    case 'In Review': return { hex: '#a855f7', tw: 'bg-purple-100 text-purple-800' };
    case 'On Hold': return { hex: '#f59e0b', tw: 'bg-amber-100 text-amber-800' };
    case 'Completed': return { hex: '#22c55e', tw: 'bg-green-100 text-green-800' };
    case 'Cancelled': return { hex: '#ef4444', tw: 'bg-red-100 text-red-800' };
    default: return { hex: '#6b7280', tw: 'bg-gray-100 text-gray-800' };
  }
};

export const getPaymentStatusStyles = (status: PaymentStatus | string) => {
    switch (status) {
        case 'Paid': return { hex: '#22c55e', tw: 'bg-green-100 text-green-800' };
        case 'Pending': return { hex: '#f59e0b', tw: 'bg-amber-100 text-amber-800' };
        case 'In Process': return { hex: '#a855f7', tw: 'bg-purple-100 text-purple-800' };
        case 'Overdue': return { hex: '#ef4444', tw: 'bg-red-100 text-red-800' };
        case 'Proposed': return { hex: '#3b82f6', tw: 'bg-blue-100 text-blue-800' };
        case 'Cancelled': return { hex: '#6b7280', tw: 'bg-gray-100 text-gray-800' };
        case 'Unpaid':
        default: return { hex: '#9ca3af', tw: 'bg-gray-200 text-gray-800' };
    }
};

export const getPriorityStyles = (priority: TaskPriority | string | null) => {
    switch (priority) {
        case 'Urgent': return { hex: '#ef4444', tw: 'bg-red-100 text-red-800' };
        case 'High': return { hex: '#f97316', tw: 'bg-orange-100 text-orange-800' };
        case 'Normal': return { hex: '#3b82f6', tw: 'bg-blue-100 text-blue-800' };
        case 'Low': return { hex: '#6b7280', tw: 'bg-gray-100 text-gray-800' };
        default: return { hex: '#6b7280', tw: 'bg-gray-100 text-gray-800' };
    }
};

export const getTaskStatusStyles = (status: TaskStatus | string) => {
    switch (status) {
        case 'To do': return { tw: 'text-muted-foreground' };
        case 'In Progress': return { tw: 'text-blue-600 font-semibold' };
        case 'Done': return { tw: 'text-green-600 font-semibold' };
        case 'Cancelled': return { tw: 'text-red-600 line-through' };
        default: return { tw: 'text-muted-foreground' };
    }
};

export const isOverdue = (date: string | Date): boolean => {
    if (!date) return false;
    return isPastFns(new Date(date)) && !isSameDay(new Date(date), new Date());
};

export const formatPhoneNumberForApi = (phone: string): string => {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.substring(1);
    } else if (!cleaned.startsWith('62')) {
        cleaned = '62' + cleaned;
    }
    return cleaned;
};

export const getColorForTag = (tagName: string): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#F7B801',
    '#5FAD56', '#F26419', '#8338EC', '#FF006E',
  ];
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % colors.length);
  return colors[index];
};