import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { isPast as isPastDate, endOfDay } from 'date-fns';
import { format as formatTz, toZonedTime } from 'date-fns-tz';
import { color } from '@uiw/color-convert';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getAvatarUrl = (avatarUrl: string | null | undefined, seed: string): string => {
  if (avatarUrl) {
    return avatarUrl;
  }
  
  let hash = 0;
  const seedString = String(seed || '');
  if (seedString) {
    for (let i = 0; i < seedString.length; i++) {
      hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  const h = hash % 360;
  const s = 70;
  const l = 90;
  
  const colorObject = color(`hsl(${h}, ${s}%, ${l}%)`);
  const pastelHex = colorObject.hex.substring(1);

  return `https://api.dicebear.com/7.x/initials/svg?seed=${seedString}&backgroundColor=${pastelHex}&backgroundType=solid`;
};

export const generatePastelColor = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return { backgroundColor: `hsl(${h}, 70%, 90%)`, color: `hsl(${h}, 70%, 30%)` };
};

export const getInitials = (fullName?: string | null, email?: string | null): string => {
  if (fullName && fullName.trim()) {
    const names = fullName.trim().split(' ');
    if (names.length > 1) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return 'NN';
};

export const getStatusStyles = (status: string) => {
  const styles: { [key: string]: { hex: string; tw: string } } = {
    'Requested': { hex: '#64748b', tw: 'bg-slate-100 text-slate-800' },
    'In Progress': { hex: '#2563eb', tw: 'bg-blue-100 text-blue-800' },
    'In Review': { hex: '#ca8a04', tw: 'bg-yellow-100 text-yellow-800' },
    'On Hold': { hex: '#64748b', tw: 'bg-slate-100 text-slate-800' },
    'Completed': { hex: '#16a34a', tw: 'bg-green-100 text-green-800' },
    'Cancelled': { hex: '#dc2626', tw: 'bg-red-100 text-red-800' },
    'Default': { hex: '#64748b', tw: 'bg-slate-100 text-slate-800' },
  };
  return styles[status] || styles['Default'];
};

export const getPaymentStatusStyles = (status: string) => {
    const styles: { [key: string]: { hex: string; tw: string } } = {
        'Paid': { hex: '#16a34a', tw: 'bg-green-100 text-green-800' },
        'Unpaid': { hex: '#dc2626', tw: 'bg-red-100 text-red-800' },
        'Pending': { hex: '#f97316', tw: 'bg-orange-100 text-orange-800' },
        'In Process': { hex: '#6366f1', tw: 'bg-indigo-100 text-indigo-800' },
        'Overdue': { hex: '#e11d48', tw: 'bg-rose-100 text-rose-800' },
        'Proposed': { hex: '#0ea5e9', tw: 'bg-sky-100 text-sky-800' },
        'Cancelled': { hex: '#64748b', tw: 'bg-slate-100 text-slate-800' },
        'Default': { hex: '#64748b', tw: 'bg-slate-100 text-slate-800' },
    };
    return styles[status] || styles['Default'];
};

export const formatInJakarta = (date: Date | string | number, formatString: string = 'dd MMM yyyy, HH:mm'): string => {
  try {
    const timeZone = 'Asia/Jakarta';
    const zonedDate = toZonedTime(date, timeZone);
    return formatTz(zonedDate, formatString, { timeZone });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
};

export const getPriorityStyles = (priority: string | null) => {
    const styles: { [key: string]: { hex: string; tw: string; } } = {
        'Urgent': { hex: '#dc2626', tw: 'bg-red-100 text-red-800' },
        'High': { hex: '#f97316', tw: 'bg-orange-100 text-orange-800' },
        'Normal': { hex: '#2563eb', tw: 'bg-blue-100 text-blue-800' },
        'Low': { hex: '#64748b', tw: 'bg-slate-100 text-slate-800' },
        'Default': { hex: '#64748b', tw: 'bg-slate-100 text-slate-800' },
    };
    return styles[priority || 'Default'] || styles['Default'];
};

export const getTaskStatusStyles = (status: string) => {
    const styles: { [key: string]: { hex: string; tw: string; } } = {
        'To do': { hex: '#64748b', tw: 'text-slate-600' },
        'In Progress': { hex: '#2563eb', tw: 'text-blue-600' },
        'Done': { hex: '#16a34a', tw: 'text-green-600' },
        'Cancelled': { hex: '#dc2626', tw: 'text-red-600' },
        'Default': { hex: '#64748b', tw: 'text-slate-600' },
    };
    return styles[status] || styles['Default'];
};

export const isOverdue = (dueDate: string | Date | null | undefined): boolean => {
  if (!dueDate) return false;
  return isPastDate(endOfDay(new Date(dueDate)));
};

export const getInstagramUsername = (url: string): string | null => {
  if (!url) return null;
  try {
    const urlObject = new URL(url);
    if (urlObject.hostname.includes('instagram.com')) {
      const pathParts = urlObject.pathname.split('/').filter(part => part);
      return pathParts[0] || null;
    }
  } catch (e) {
    // Not a valid URL, maybe it's just a username
    if (!url.includes('/') && !url.includes('.')) {
      return url;
    }
  }
  return null;
};

export const getColorForTag = (tagName: string): { bg: string; text: string; border: string } => {
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return {
    bg: `hsl(${h}, 90%, 95%)`,
    text: `hsl(${h}, 70%, 30%)`,
    border: `hsl(${h}, 80%, 85%)`,
  };
};

export const getStatusColor = (status: string) => {
  const statusColors: { [key: string]: { color: string; } } = {
    'On Track': { color: '#16a34a' },
    'Completed': { color: '#16a34a' },
    'Done': { color: '#16a34a' },
    'At Risk': { color: '#f97316' },
    'Off Track': { color: '#dc2626' },
    'On Hold': { color: '#64748b' },
    'To Do': { color: '#64748b' },
    'In Progress': { color: '#2563eb' },
    'Default': { color: '#64748b' },
  };

  const style = statusColors[status] || statusColors['Default'];
  return {
    color: style.color,
    borderColor: style.color,
    backgroundColor: `${style.color}1A`, // 10% opacity
  };
};