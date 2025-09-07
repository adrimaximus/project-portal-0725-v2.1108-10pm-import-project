import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatInTimeZone } from 'date-fns-tz'
import { id } from 'date-fns/locale'

const pastelColors = [
  'a8e6cf', 'dcedc1', 'ffd3b6', 'ffaaa5', 'ff8b94',
  'bde0fe', 'a2d2ff', 'cdb4db', 'ffc8dd', 'ffafcc',
  'b2e2f2', 'f1cbff', 'f9d5e5', 'fff2cc', 'd4a5a5'
];

const getConsistentPastelColor = (str: string): string => {
  if (!str) {
    return pastelColors[0];
  }
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const index = Math.abs(hash % pastelColors.length);
  return pastelColors[index];
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getInitials = (name: string = "", email?: string): string => {
  const names = name.trim().split(' ').filter(Boolean);
  
  if (names.length === 0) {
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return "";
  }

  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  
  const firstName = names[0];
  const lastName = names[names.length - 1];
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

export const getAvatarUrl = (avatarUrl?: string | null, seed?: string | null): string => {
  if (avatarUrl) {
    return avatarUrl;
  }
  const finalSeed = seed || 'default-avatar';
  const bgColor = getConsistentPastelColor(finalSeed);
  return `https://api.dicebear.com/8.x/lorelei/svg?seed=${encodeURIComponent(finalSeed)}&backgroundColor=${bgColor}`;
};

export const generatePastelColor = (str: string): { backgroundColor: string; color: string } => {
  if (!str) {
    return { backgroundColor: '#e2e8f0', color: '#475569' }; // slate-200, slate-600
  }
  const hexBg = getConsistentPastelColor(str);
  
  let r = parseInt(hexBg.substring(0, 2), 16);
  let g = parseInt(hexBg.substring(2, 4), 16);
  let b = parseInt(hexBg.substring(4, 6), 16);

  // Darken the color for text
  r = Math.max(0, r - 100);
  g = Math.max(0, g - 100);
  b = Math.max(0, b - 100);

  const toHex = (c: number) => c.toString(16).padStart(2, '0');

  return { backgroundColor: `#${hexBg}`, color: `#${toHex(r)}${toHex(g)}${toHex(b)}` };
};

export const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Completed':
      return { tw: 'bg-green-100 text-green-800 border-green-200', hex: '#16a34a' };
    case 'In Progress':
      return { tw: 'bg-blue-100 text-blue-800 border-blue-200', hex: '#2563eb' };
    case 'In Review':
      return { tw: 'bg-purple-100 text-purple-800 border-purple-200', hex: '#9333ea' };
    case 'On Hold':
      return { tw: 'bg-yellow-100 text-yellow-800 border-yellow-200', hex: '#ca8a04' };
    case 'Cancelled':
      return { tw: 'bg-red-100 text-red-800 border-red-200', hex: '#dc2626' };
    case 'Requested':
      return { tw: 'bg-gray-100 text-gray-800 border-gray-200', hex: '#6b7280' };
    default:
      return { tw: 'bg-gray-100 text-gray-800 border-gray-200', hex: '#6b7280' };
  }
};

export const paymentStatusConfig: Record<string, { tw: string; hex: string }> = {
  'Paid': { tw: 'bg-green-100 text-green-800 border-green-200', hex: '#16a34a' },
  'Pending': { tw: 'bg-yellow-100 text-yellow-800 border-yellow-200', hex: '#ca8a04' },
  'In Process': { tw: 'bg-purple-100 text-purple-800 border-purple-200', hex: '#9333ea' },
  'Overdue': { tw: 'bg-red-100 text-red-800 border-red-200', hex: '#dc2626' },
  'Proposed': { tw: 'bg-blue-100 text-blue-800 border-blue-200', hex: '#2563eb' },
  'Cancelled': { tw: 'bg-gray-100 text-gray-800 border-gray-200', hex: '#6b7280' },
  'Unpaid': { tw: 'bg-orange-100 text-orange-800 border-orange-200', hex: '#f97316' },
};

export const getPaymentStatusStyles = (status: string) => {
  return paymentStatusConfig[status] || { tw: 'bg-gray-100 text-gray-800 border-gray-200', hex: '#6b7280' };
};

export const getTaskStatusStyles = (status: string) => {
  switch (status) {
    case 'Done':
      return { tw: 'text-green-600 font-medium', hex: '#16a34a' };
    case 'In Progress':
      return { tw: 'text-blue-600 font-medium', hex: '#2563eb' };
    case 'Cancelled':
      return { tw: 'text-red-600 font-medium', hex: '#dc2626' };
    case 'To do':
    default:
      return { tw: 'text-gray-600 font-medium', hex: '#6b7280' };
  }
};

export const getPriorityStyles = (priority: string | null) => {
  switch (priority) {
    case 'Urgent':
      return { tw: 'bg-red-600 text-white border-transparent', hex: '#dc2626' };
    case 'High':
      return { tw: 'bg-orange-500 text-white border-transparent', hex: '#f97316' };
    case 'Normal':
      return { tw: 'bg-blue-500 text-white border-transparent', hex: '#2563eb' };
    case 'Low':
    default:
      return { tw: 'bg-gray-400 text-white border-transparent', hex: '#6b7280' };
  }
};

export const mapProfileToUser = (profile: any) => {
  if (!profile) return null;
  const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
  return {
    id: profile.id,
    name: name || profile.email,
    avatar_url: profile.avatar_url,
    initials: getInitials(name || profile.email),
    email: profile.email,
  };
};

const tagColors = [
  { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' },
  { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
  { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
];

export const getColorForTag = (tagName: string) => {
  if (!tagName) return tagColors[tagColors.length - 1];
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % tagColors.length);
  return tagColors[index];
};

export const formatInJakarta = (dateString: string | Date | null | undefined, formatStr: string): string => {
    if (!dateString) return 'N/A';
    try {
        return formatInTimeZone(dateString, 'Asia/Jakarta', formatStr, { locale: id });
    } catch (error) {
        console.error("Error formatting date:", error);
        return "Invalid Date";
    }
}

export const isOverdue = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;
  const today = new Date();
  const dueDate = new Date(dateString);
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate <= today;
};

export const getInstagramUsername = (url: string | undefined): string | null => {
  if (!url) return null;
  try {
    const path = new URL(url).pathname;
    const parts = path.split('/').filter(p => p);
    return parts[0] ? `@${parts[0]}` : null;
  } catch (e) {
    if (typeof url === 'string' && !url.includes('/')) {
      return `@${url}`;
    }
    return null;
  }
};