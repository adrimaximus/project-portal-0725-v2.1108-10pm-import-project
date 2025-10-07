import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns-tz';
import { isPast, startOfDay } from 'date-fns';
import React from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatInJakarta = (date: string | Date, formatString: string) => {
  if (!date) return '';
  const timeZone = 'Asia/Jakarta';
  try {
    return format(new Date(date), formatString, { timeZone });
  } catch (error) {
    console.error("Invalid date provided to formatInJakarta:", date);
    return "Invalid Date";
  }
};

export const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Not Started':
      return { tw: 'bg-gray-200 text-gray-800', hex: '#E5E7EB' };
    case 'Requested':
      return { tw: 'bg-blue-100 text-blue-800', hex: '#DBEAFE' };
    case 'In Progress':
      return { tw: 'bg-yellow-100 text-yellow-800', hex: '#FDE68A' };
    case 'In Review':
      return { tw: 'bg-purple-100 text-purple-800', hex: '#DDD6FE' };
    case 'On Hold':
      return { tw: 'bg-orange-100 text-orange-800', hex: '#FED7AA' };
    case 'Completed':
      return { tw: 'bg-green-100 text-green-800', hex: '#A7F3D0' };
    case 'Cancelled':
      return { tw: 'bg-red-100 text-red-800', hex: '#FECACA' };
    // Fallbacks for any old statuses that might still exist
    case 'On Track':
      return { tw: 'bg-blue-100 text-blue-800', hex: '#DBEAFE' };
    case 'At Risk':
      return { tw: 'bg-yellow-100 text-yellow-800', hex: '#FDE68A' };
    case 'Off Track':
      return { tw: 'bg-red-100 text-red-800', hex: '#FECACA' };
    default:
      return { tw: 'bg-gray-100 text-gray-800', hex: '#F3F4F6' };
  }
};

export const getPaymentStatusStyles = (status: string) => {
  switch (status) {
    case 'Paid':
      return { tw: 'bg-green-100 text-green-800', hex: '#A7F3D0' };
    case 'Pending':
      return { tw: 'bg-yellow-100 text-yellow-800', hex: '#FDE68A' };
    case 'In Process':
      return { tw: 'bg-purple-100 text-purple-800', hex: '#DDD6FE' };
    case 'Overdue':
      return { tw: 'bg-red-100 text-red-800', hex: '#FECACA' };
    case 'Proposed':
      return { tw: 'bg-blue-100 text-blue-800', hex: '#DBEAFE' };
    case 'Cancelled':
      return { tw: 'bg-gray-200 text-gray-800', hex: '#E5E7EB' };
    default:
      return { tw: 'bg-gray-100 text-gray-800', hex: '#F3F4F6' };
  }
};

export const generatePastelColor = (str: string): React.CSSProperties => {
  if (!str) return { backgroundColor: 'hsl(0, 75%, 80%)' };
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return { backgroundColor: `hsl(${h}, 75%, 80%)` };
};

export const getAvatarUrl = (avatarUrl?: string | null, _id?: string): string | undefined => {
  return avatarUrl || undefined;
};

export const getInitials = (name?: string | null, email?: string): string => {
  const targetName = name || email || '';
  if (!targetName) return '??';

  const names = targetName.trim().split(' ').filter(Boolean);
  
  if (names.length > 1 && !targetName.includes('@')) {
    const first = names[0][0];
    const last = names[names.length - 1][0];
    if (first && last) {
      return `${first}${last}`.toUpperCase();
    }
  }
  
  if (names.length === 1 && names[0].length > 1) {
    return names[0].substring(0, 2).toUpperCase();
  }
  
  if (names.length === 1) {
    return names[0].substring(0, 1).toUpperCase();
  }

  if (targetName.includes('@')) {
    return targetName.substring(0, 2).toUpperCase();
  }

  return '??';
};

export const getPriorityStyles = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return { tw: 'text-red-500', iconColor: 'text-red-500', hex: '#EF4444' };
    case 'medium':
      return { tw: 'text-yellow-500', iconColor: 'text-yellow-500', hex: '#EAB308' };
    case 'low':
      return { tw: 'text-green-500', iconColor: 'text-green-500', hex: '#22C55E' };
    default:
      return { tw: 'text-gray-500', iconColor: 'text-gray-500', hex: '#6B7280' };
  }
};

export const getTaskStatusStyles = (status: string) => {
  switch (status) {
    case 'To do':
      return { tw: 'bg-gray-200 text-gray-800' };
    case 'In Progress':
      return { tw: 'bg-blue-200 text-blue-800' };
    case 'Done':
      return { tw: 'bg-green-200 text-green-800' };
    default:
      return { tw: 'bg-gray-100 text-gray-800' };
  }
};

export const isOverdue = (date?: string | Date | null): boolean => {
  if (!date) return false;
  return new Date(date) < startOfDay(new Date());
};

export const formatPhoneNumberForApi = (phone: string): string => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('62')) {
     cleaned = '62' + cleaned;
  }
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
};

export const getColorForTag = (tagName: string): string => {
  if (!tagName) return 'hsl(0, 90%, 85%)';
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 90%, 85%)`;
};