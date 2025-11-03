import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ProjectStatus, PaymentStatus } from "@/types";
import { format as formatFns, toZonedTime, isPast as isPastFns } from 'date-fns-tz';
import React from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getProjectStatusStyles = (status: ProjectStatus) => {
  switch (status) {
    case 'Requested':
      return { tw: 'bg-blue-100 text-blue-800', hex: '#3b82f6' };
    case 'On Hold':
      return { tw: 'bg-yellow-100 text-yellow-800', hex: '#f59e0b' };
    case 'Reschedule':
      return { tw: 'bg-yellow-100 text-yellow-800', hex: '#f59e0b' };
    case 'In Progress':
      return { tw: 'bg-blue-100 text-blue-800', hex: '#3b82f6' };
    case 'Billing Process':
      return { tw: 'bg-blue-100 text-blue-800', hex: '#3b82f6' };
    case 'Completed':
      return { tw: 'bg-green-100 text-green-800', hex: '#22c55e' };
    case 'Cancelled':
      return { tw: 'bg-red-100 text-red-800', hex: '#ef4444' };
    case 'Bid Lost':
      return { tw: 'bg-gray-100 text-gray-800', hex: '#6b7280' };
    case 'Archived':
      return { tw: 'bg-gray-100 text-gray-800', hex: '#6b7280' };
    default:
      return { tw: 'bg-gray-100 text-gray-800', hex: '#6b7280' };
  }
};

export const getPaymentStatusStyles = (status: PaymentStatus) => {
  switch (status) {
    case 'Paid':
      return { tw: 'bg-green-100 text-green-800', hex: '#22c55e' };
    case 'Overdue':
      return { tw: 'bg-red-100 text-red-800', hex: '#ef4444' };
    case 'Partially Paid':
      return { tw: 'bg-yellow-100 text-yellow-800', hex: '#f59e0b' };
    case 'Pending':
      return { tw: 'bg-yellow-100 text-yellow-800', hex: '#f59e0b' };
    case 'In Process':
      return { tw: 'bg-purple-100 text-purple-800', hex: '#8b5cf6' };
    case 'Requested':
      return { tw: 'bg-gray-100 text-gray-800', hex: '#6b7280' };
    case 'Proposed':
      return { tw: 'bg-indigo-100 text-indigo-800', hex: '#6366f1' };
    case 'Quo Approved':
      return { tw: 'bg-teal-100 text-teal-800', hex: '#14b8a6' };
    case 'Inv Approved':
      return { tw: 'bg-emerald-100 text-emerald-800', hex: '#10b981' };
    case 'Cancelled':
      return { tw: 'bg-red-100 text-red-800', hex: '#ef4444' };
    case 'Bid Lost':
      return { tw: 'bg-gray-100 text-gray-800', hex: '#6b7280' };
    default:
      return { tw: 'bg-gray-100 text-gray-800', hex: '#6b7280' };
  }
};

export const formatInJakarta = (date: Date | string, formatString: string) => {
  const timeZone = 'Asia/Jakarta';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const zonedDate = toZonedTime(dateObj, timeZone);
  return formatFns(zonedDate, formatString, { timeZone });
};

export const getAvatarUrl = (avatarUrl?: string | null, seed?: string): string => {
  if (avatarUrl) {
    return avatarUrl;
  }
  const seedStr = seed || Math.random().toString();
  return `https://api.dicebear.com/8.x/micah/svg?seed=${encodeURIComponent(seedStr)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
};

export const getInitials = (name?: string | null, fallback?: string | null): string => {
  if (!name && !fallback) return 'NN';
  const targetName = name || fallback || '';
  const nameParts = targetName.split(' ').filter(Boolean);
  if (nameParts.length > 1) {
    return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
  }
  if (nameParts.length === 1 && nameParts[0].length > 1) {
    return nameParts[0].substring(0, 2).toUpperCase();
  }
  if (nameParts.length === 1 && nameParts[0].length === 1) {
    return nameParts[0].toUpperCase();
  }
  return fallback ? fallback.substring(0, 2).toUpperCase() : 'NN';
};

export const generatePastelColor = (seed: string): React.CSSProperties => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return { backgroundColor: `hsl(${h}, 70%, 80%)` };
};

export const formatPhoneNumberForApi = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
};

export const getErrorMessage = (error: any, defaultMessage = "An unexpected error occurred."): string => {
  if (!error) return defaultMessage;
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.error_description) return error.error_description;
  try {
    return JSON.stringify(error);
  } catch {
    return defaultMessage;
  }
};

export const parseMentions = (text: string): string[] => {
  const regex = /@\[[^\]]+\]\(([^)]+)\)/g;
  const matches = text.matchAll(regex);
  const userIds = Array.from(matches, match => match[1]);
  return userIds;
};

export const formatMentionsForDisplay = (text: string): string => {
  if (!text) return '';
  return text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '**@$1**');
};

export const formatTaskText = (text: string | null | undefined, maxLength?: number): string => {
  if (!text) return '';
  const cleanedText = text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1');
  if (maxLength && cleanedText.length > maxLength) {
    return cleanedText.substring(0, maxLength) + '...';
  }
  return cleanedText;
};

export const getPriorityStyles = (priority: string | null | undefined) => {
  switch (priority?.toLowerCase()) {
    case 'urgent':
      return { tw: 'bg-red-100 text-red-800', hex: '#ef4444' };
    case 'high':
      return { tw: 'bg-orange-100 text-orange-800', hex: '#f97316' };
    case 'medium':
      return { tw: 'bg-yellow-100 text-yellow-800', hex: '#f59e0b' };
    case 'normal':
      return { tw: 'bg-blue-100 text-blue-800', hex: '#3b82f6' };
    case 'low':
    default:
      return { tw: 'bg-gray-100 text-gray-800', hex: '#6b7280' };
  }
};

export const getTaskStatusStyles = (status: string | null | undefined) => {
  switch (status) {
    case 'Done':
      return { tw: 'bg-green-100 text-green-800' };
    case 'In Progress':
      return { tw: 'bg-blue-100 text-blue-800' };
    case 'To do':
      return { tw: 'bg-gray-100 text-gray-800' };
    case 'Blocked':
      return { tw: 'bg-red-100 text-red-800' };
    default:
      return { tw: 'bg-gray-100 text-gray-800' };
  }
};

export const isOverdue = (dueDateStr: string | null | undefined): boolean => {
  if (!dueDateStr) return false;
  const dueDate = new Date(dueDateStr);
  const now = new Date();
  return now > dueDate;
};

export const getDueDateClassName = (dueDateStr: string | null | undefined, completed: boolean): string => {
  if (!dueDateStr || completed) {
    return "text-muted-foreground";
  }
  const dueDate = new Date(dueDateStr);
  if (isPastFns(dueDate)) {
    return "text-destructive font-semibold";
  }
  return "text-muted-foreground";
};

export const getColorForTag = (tagName: string): string => {
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 50%, 70%)`;
};