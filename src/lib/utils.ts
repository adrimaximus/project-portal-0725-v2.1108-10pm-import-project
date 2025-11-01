import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, toZonedTime } from 'date-fns-tz';
import React from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getProjectStatusStyles(status: string) {
  switch (status) {
    case "Completed":
      return { hex: "#22c55e", tw: "bg-green-100 text-green-800 border-green-200" };
    case "In Progress":
      return { hex: "#3b82f6", tw: "bg-blue-100 text-blue-800 border-blue-200" };
    case "Billing Process":
      return { hex: "#8b5cf6", tw: "bg-violet-100 text-violet-800 border-violet-200" };
    case "On Hold":
      return { hex: "#f97316", tw: "bg-orange-100 text-orange-800 border-orange-200" };
    case "Reschedule":
      return { hex: "#eab308", tw: "bg-yellow-100 text-yellow-800 border-yellow-200" };
    case "Cancelled":
      return { hex: "#ef4444", tw: "bg-red-100 text-red-800 border-red-200" };
    case "Bid Lost":
      return { hex: "#dc2626", tw: "bg-red-200 text-red-900 border-red-300" };
    case "Requested":
      return { hex: "#60a5fa", tw: "bg-sky-100 text-sky-800 border-sky-200" };
    case "Archived":
    default:
      return { hex: "#64748b", tw: "bg-slate-100 text-slate-800 border-slate-200" };
  }
}

export function getPaymentStatusStyles(status: string) {
  switch (status) {
    case 'Paid':
      return { tw: 'bg-green-100 text-green-800' };
    case 'Partially Paid':
      return { tw: 'bg-yellow-100 text-yellow-800' };
    case 'Overdue':
      return { tw: 'bg-red-100 text-red-800' };
    case 'Unpaid':
    default:
      return { tw: 'bg-gray-100 text-gray-800' };
  }
}

export function getTaskStatusStyles(status?: string | null) {
  switch (status?.toLowerCase()) {
    case 'done':
      return { tw: 'bg-green-100 text-green-800' };
    case 'in review':
      return { tw: 'bg-purple-100 text-purple-800' };
    case 'in progress':
      return { tw: 'bg-blue-100 text-blue-800' };
    case 'to do':
    default:
      return { tw: 'bg-gray-100 text-gray-800' };
  }
}

export function getPriorityStyles(priority?: string | null) {
  switch (priority?.toLowerCase()) {
    case 'urgent':
      return { hex: '#ef4444', tw: 'bg-red-100 text-red-800' };
    case 'high':
      return { hex: '#f97316', tw: 'bg-orange-100 text-orange-800' };
    case 'medium':
      return { hex: '#eab308', tw: 'bg-yellow-100 text-yellow-800' };
    case 'normal':
      return { hex: '#3b82f6', tw: 'bg-blue-100 text-blue-800' };
    case 'low':
    default:
      return { hex: '#6b7280', tw: 'bg-gray-100 text-gray-800' };
  }
}

export const formatInJakarta = (date: string | Date, formatString: string) => {
  const timeZone = 'Asia/Jakarta';
  const zonedDate = toZonedTime(date, timeZone);
  return format(zonedDate, formatString, { timeZone });
};

export const getErrorMessage = (error: any, defaultMessage = "An unexpected error occurred.") => {
  if (typeof error === 'string') return error;
  if (error && typeof error.message === 'string') return error.message;
  return defaultMessage;
};

export const getAvatarUrl = (avatarUrl: string | null | undefined, seed: string): string => {
  if (avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('blob:'))) {
    return avatarUrl;
  }
  const colors = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'];
  return `https://api.dicebear.com/8.x/micah/svg?seed=${seed}&backgroundColor=${colors.join(',')}`;
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
    if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return 'NN';
};

export const generatePastelColor = (seed: string): React.CSSProperties => {
  if (!seed) return { backgroundColor: '#e5e7eb' };
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return { backgroundColor: `hsl(${h}, 70%, 85%)` };
};

export const isOverdue = (dueDateStr: string | null | undefined): boolean => {
  if (!dueDateStr) return false;
  const dueDate = new Date(dueDateStr);
  return dueDate < new Date();
};

export const parseMentions = (text: string): string[] => {
  const mentionRegex = /@\[[^\]]+\]\(([^)]+)\)/g;
  const matches = text.matchAll(mentionRegex);
  const userIds = Array.from(matches, match => match[1]);
  return userIds;
};

export const formatMentionsForDisplay = (text: string): string => {
  if (!text) return '';
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  return text.replace(mentionRegex, '@$1');
};

export const formatPhoneNumberForApi = (phone: string): string | null => {
    if (!phone) return null;
    let cleaned = phone.trim().replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      return '62' + cleaned.substring(1);
    }
    if (cleaned.startsWith('62')) {
      return cleaned;
    }
    if (cleaned.length > 8 && cleaned.startsWith('8')) {
      return '62' + cleaned;
    }
    return cleaned;
};

export const formatTaskText = (text: string, maxLength?: number): string => {
  if (!text) return '';
  let formattedText = text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1');
  if (maxLength && formattedText.length > maxLength) {
    formattedText = formattedText.substring(0, maxLength) + '...';
  }
  return formattedText;
};