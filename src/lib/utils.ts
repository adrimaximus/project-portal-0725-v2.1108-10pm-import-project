import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ProjectStatus, PaymentStatus, UserProfile } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Requested':
      return { hex: '#3B82F6', tw: 'bg-blue-100 text-blue-800' };
    case 'In Progress':
      return { hex: '#F59E0B', tw: 'bg-amber-100 text-amber-800' };
    case 'In Review':
      return { hex: '#8B5CF6', tw: 'bg-purple-100 text-purple-800' };
    case 'On Hold':
      return { hex: '#6B7280', tw: 'bg-gray-100 text-gray-800' };
    case 'Completed':
      return { hex: '#10B981', tw: 'bg-emerald-100 text-emerald-800' };
    case 'Cancelled':
      return { hex: '#EF4444', 'tw': 'bg-red-100 text-red-800' };
    case 'Proposed':
      return { hex: '#A855F7', tw: 'bg-fuchsia-100 text-fuchsia-800' };
    case 'Pending':
      return { hex: '#F59E0B', tw: 'bg-amber-100 text-amber-800' };
    case 'Paid':
      return { hex: '#10B981', tw: 'bg-emerald-100 text-emerald-800' };
    case 'Overdue':
      return { hex: '#EF4444', tw: 'bg-red-100 text-red-800' };
    default:
      return { hex: '#6B7280', tw: 'bg-gray-100 text-gray-800' };
  }
};

interface RawProfile {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  [key: string]: any;
}

export const mapProfileToUser = (profile: RawProfile): UserProfile => {
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email || 'Unknown User';
  const initials = ((profile.first_name?.[0] || '') + (profile.last_name?.[0] || '')).toUpperCase() || 'NN';

  return {
    id: profile.id,
    name,
    email: profile.email || undefined,
    avatar: profile.avatar_url || undefined,
    initials,
    first_name: profile.first_name || undefined,
    last_name: profile.last_name || undefined,
  };
};

const TAG_COLORS = [
  { bg: 'bg-red-200', text: 'text-red-800', border: 'border-red-300' },
  { bg: 'bg-yellow-200', text: 'text-yellow-800', border: 'border-yellow-300' },
  { bg: 'bg-green-200', text: 'text-green-800', border: 'border-green-300' },
  { bg: 'bg-blue-200', text: 'text-blue-800', border: 'border-blue-300' },
  { bg: 'bg-indigo-200', text: 'text-indigo-800', border: 'border-indigo-300' },
  { bg: 'bg-purple-200', text: 'text-purple-800', border: 'border-purple-300' },
  { bg: 'bg-pink-200', text: 'text-pink-800', border: 'border-pink-300' },
  { bg: 'bg-gray-200', text: 'text-gray-800', border: 'border-gray-300' },
];

const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
};

export const getColorForTag = (tag: string): { bg: string; text: string; border: string } => {
  if (!tag) return TAG_COLORS[7];
  const hash = simpleHash(tag);
  return TAG_COLORS[hash % (TAG_COLORS.length - 1)];
};