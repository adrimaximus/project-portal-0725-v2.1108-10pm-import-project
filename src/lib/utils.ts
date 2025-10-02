import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { isPast as isPastFns, isSameDay } from 'date-fns';
import { ProjectStatus, PaymentStatus, TaskPriority, TaskStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getAvatarUrl = (avatarUrl: string | null | undefined, userId: string) => {
  if (avatarUrl) return avatarUrl;
  return `https://api.dicebear.com/6.x/initials/svg?seed=${userId}`;
};

export const generatePastelColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 70%, 80%)`;
};

export const getInitials = (name?: string | null, email?: string | null) => {
  if (name) {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return '??';
};

export const formatInJakarta = (date: Date | string) => {
  return new Date(date).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
};

export const formatPhoneNumberForApi = (phone: string) => {
  return phone.replace(/[^0-9]/g, '');
};

export const isOverdue = (dueDate: string | null) => {
  if (!dueDate) return false;
  return isPastFns(new Date(dueDate)) && !isSameDay(new Date(dueDate), new Date());
};

const statusStyles: { [key in ProjectStatus]: { tw: string; hex: string } } = {
  'On Track': { tw: 'bg-green-100 text-green-800', hex: '#34D399' },
  'At Risk': { tw: 'bg-yellow-100 text-yellow-800', hex: '#FBBF24' },
  'Off Track': { tw: 'bg-red-100 text-red-800', hex: '#F87171' },
  'On Hold': { tw: 'bg-gray-100 text-gray-800', hex: '#9CA3AF' },
  'Completed': { tw: 'bg-blue-100 text-blue-800', hex: '#60A5FA' },
};
export const getStatusStyles = (status: ProjectStatus) => statusStyles[status] || statusStyles['On Hold'];

const paymentStatusStyles: { [key in PaymentStatus]: { tw: string; hex: string } } = {
  'Paid': { tw: 'bg-green-100 text-green-800', hex: '#34D399' },
  'Unpaid': { tw: 'bg-gray-100 text-gray-800', hex: '#9CA3AF' },
  'Partially Paid': { tw: 'bg-yellow-100 text-yellow-800', hex: '#FBBF24' },
  'Overdue': { tw: 'bg-red-100 text-red-800', hex: '#F87171' },
};
export const getPaymentStatusStyles = (status: PaymentStatus) => paymentStatusStyles[status] || paymentStatusStyles['Unpaid'];

const priorityStyles: { [key in TaskPriority]: { tw: string; hex: string } } = {
  'low': { tw: 'bg-gray-100 text-gray-800', hex: '#9CA3AF' },
  'normal': { tw: 'bg-blue-100 text-blue-800', hex: '#60A5FA' },
  'high': { tw: 'bg-red-100 text-red-800', hex: '#F87171' },
};
export const getPriorityStyles = (priority: TaskPriority) => priorityStyles[priority] || priorityStyles['normal'];

const taskStatusStyles: { [key in TaskStatus]: { tw: string; hex: string } } = {
  'To do': { tw: 'bg-gray-100 text-gray-800', hex: '#9CA3AF' },
  'In progress': { tw: 'bg-blue-100 text-blue-800', hex: '#60A5FA' },
  'Done': { tw: 'bg-green-100 text-green-800', hex: '#34D399' },
};
export const getTaskStatusStyles = (status: TaskStatus) => taskStatusStyles[status] || taskStatusStyles['To do'];

export const getColorForTag = (tagName: string) => {
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 70%, 80%)`;
};