import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { isPast as isPastFns, isSameDay } from 'date-fns';
import { ProjectStatus, PaymentStatus, TaskPriority, TaskStatus } from "@/types";
import { formatInTimeZone } from 'date-fns-tz';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getInitials = (name: string = '', email?: string): string => {
  if (name) {
    const names = name.trim().split(' ');
    if (names.length > 1 && names[0] && names[names.length - 1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    if (names[0] && names[0].length > 1) {
      return names[0].substring(0, 2).toUpperCase();
    }
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return '??';
};

export const getAvatarUrl = (avatarUrl: string | null | undefined, seed: string) => {
  if (avatarUrl) return avatarUrl;
  return `https://api.dicebear.com/6.x/initials/svg?seed=${seed}`;
}

export const generatePastelColor = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return { backgroundColor: `hsl(${h}, 70%, 90%)`, color: `hsl(${h}, 70%, 30%)` };
};

export const getStatusStyles = (status: ProjectStatus | string | null | undefined) => {
  switch (status) {
    case 'On Track':
      return { tw: 'bg-green-100 text-green-800', hex: '#16a34a' };
    case 'Completed':
      return { tw: 'bg-blue-100 text-blue-800', hex: '#2563eb' };
    case 'At Risk':
      return { tw: 'bg-yellow-100 text-yellow-800', hex: '#ca8a04' };
    case 'Off Track':
      return { tw: 'bg-red-100 text-red-800', hex: '#dc2626' };
    case 'On Hold':
      return { tw: 'bg-gray-100 text-gray-800', hex: '#6b7280' };
    case 'Archived':
        return { tw: 'bg-gray-100 text-gray-500', hex: '#6b7280' };
    default:
      return { tw: 'bg-gray-100 text-gray-800', hex: '#6b7280' };
  }
};

export const getPaymentStatusStyles = (status: PaymentStatus | string | null | undefined) => {
  switch (status) {
    case 'Paid':
      return { tw: 'bg-green-100 text-green-800', hex: '#22c55e' };
    case 'Unpaid':
      return { tw: 'bg-red-100 text-red-800', hex: '#ef4444' };
    case 'Pending':
      return { tw: 'bg-yellow-100 text-yellow-800', hex: '#eab308' };
    case 'Overdue':
      return { tw: 'bg-orange-100 text-orange-800', hex: '#f97316' };
    case 'Cancelled':
      return { tw: 'bg-gray-100 text-gray-500', hex: '#6b7280' };
    case 'In Process':
      return { tw: 'bg-blue-100 text-blue-800', hex: '#3b82f6' };
    case 'Due':
      return { tw: 'bg-yellow-100 text-yellow-800', hex: '#eab308' };
    default:
      return { tw: 'bg-gray-100 text-gray-800', hex: '#6b7280' };
  }
};

export const getPriorityStyles = (priority: TaskPriority | string | null | undefined) => {
  switch (priority) {
    case 'Low':
      return { tw: 'bg-gray-100 text-gray-800', hex: '#6b7280' };
    case 'Normal':
      return { tw: 'bg-blue-100 text-blue-800', hex: '#3b82f6' };
    case 'High':
      return { tw: 'bg-yellow-100 text-yellow-800', hex: '#eab308' };
    case 'Urgent':
      return { tw: 'bg-red-100 text-red-800', hex: '#ef4444' };
    default:
      return { tw: 'bg-gray-100 text-gray-800', hex: '#6b7280' };
  }
};

export const getTaskStatusStyles = (status: TaskStatus | string | null | undefined) => {
  switch (status) {
    case 'To do':
      return { tw: 'bg-gray-100 text-gray-800', label: 'To do' };
    case 'In Progress':
      return { tw: 'bg-blue-100 text-blue-800', label: 'In Progress' };
    case 'Done':
      return { tw: 'bg-green-100 text-green-800', label: 'Done' };
    case 'Cancelled':
      return { tw: 'bg-gray-100 text-gray-500', label: 'Cancelled' };
    default:
      return { tw: 'bg-gray-100 text-gray-800', label: status || 'Unknown' };
  }
};

export const isOverdue = (date: Date | string | null | undefined) => {
  if (!date) return false;
  const d = typeof date === 'string' ? new Date(date) : date;
  return isPastFns(d) && !isSameDay(d, new Date());
};

export const formatInJakarta = (date: Date | string | number, formatString: string) => {
  return formatInTimeZone(date, 'Asia/Jakarta', formatString);
};

export const formatPhoneNumberForApi = (phone: string) => {
  return phone.replace(/\D/g, '');
};

export const getColorForTag = (tagName: string) => {
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 50%, 60%)`;
};