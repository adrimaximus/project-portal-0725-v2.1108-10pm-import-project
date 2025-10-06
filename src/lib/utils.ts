import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { isPast as isPastFns, isSameDay, format } from 'date-fns';
import { ProjectStatus, PaymentStatus, TaskPriority, TaskStatus } from "@/types";
import { formatInTimeZone } from 'date-fns-tz';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getInitials = (name: string = '') => {
  if (!name) return '';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
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
      return { tw: 'bg-green-100 text-green-800', label: 'On Track' };
    case 'Completed':
      return { tw: 'bg-blue-100 text-blue-800', label: 'Completed' };
    case 'At Risk':
      return { tw: 'bg-yellow-100 text-yellow-800', label: 'At Risk' };
    case 'Off Track':
      return { tw: 'bg-red-100 text-red-800', label: 'Off Track' };
    case 'On Hold':
      return { tw: 'bg-gray-100 text-gray-800', label: 'On Hold' };
    case 'Archived':
        return { tw: 'bg-gray-100 text-gray-500', label: 'Archived' };
    default:
      return { tw: 'bg-gray-100 text-gray-800', label: status || 'Unknown' };
  }
};

export const getPaymentStatusStyles = (status: PaymentStatus | string | null | undefined) => {
  switch (status) {
    case 'Paid':
      return { tw: 'bg-green-100 text-green-800', label: 'Paid', color: '#22c55e' };
    case 'Unpaid':
      return { tw: 'bg-red-100 text-red-800', label: 'Unpaid', color: '#ef4444' };
    case 'Pending':
      return { tw: 'bg-yellow-100 text-yellow-800', label: 'Pending', color: '#eab308' };
    case 'Overdue':
      return { tw: 'bg-orange-100 text-orange-800', label: 'Overdue', color: '#f97316' };
    case 'Cancelled':
      return { tw: 'bg-gray-100 text-gray-500', label: 'Cancelled', color: '#6b7280' };
    case 'In Process':
      return { tw: 'bg-blue-100 text-blue-800', label: 'In Process', color: '#3b82f6' };
    case 'Due':
      return { tw: 'bg-yellow-100 text-yellow-800', label: 'Due', color: '#eab308' };
    default:
      return { tw: 'bg-gray-100 text-gray-800', label: status || 'Unknown', color: '#6b7280' };
  }
};

export const getPriorityStyles = (priority: TaskPriority | string | null | undefined) => {
  switch (priority) {
    case 'low':
      return { tw: 'bg-gray-100 text-gray-800', label: 'Low' };
    case 'normal':
      return { tw: 'bg-blue-100 text-blue-800', label: 'Normal' };
    case 'high':
      return { tw: 'bg-yellow-100 text-yellow-800', label: 'High' };
    case 'urgent':
      return { tw: 'bg-red-100 text-red-800', label: 'Urgent' };
    default:
      return { tw: 'bg-gray-100 text-gray-800', label: priority || 'Unknown' };
  }
};

export const getTaskStatusStyles = (status: TaskStatus | string | null | undefined) => {
  switch (status) {
    case 'To do':
      return { tw: 'bg-gray-100 text-gray-800', label: 'To do' };
    case 'In progress':
      return { tw: 'bg-blue-100 text-blue-800', label: 'In progress' };
    case 'Done':
      return { tw: 'bg-green-100 text-green-800', label: 'Done' };
    case 'Backlog':
      return { tw: 'bg-purple-100 text-purple-800', label: 'Backlog' };
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