import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatInTimeZone } from 'date-fns-tz'
import { id } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getInitials = (name: string = ""): string => {
  const names = name.trim().split(' ').filter(Boolean);
  if (names.length === 0) return "";
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  
  const firstName = names[0];
  const lastName = names[names.length - 1];
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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

export const mapProfileToUser = (profile: any) => {
  if (!profile) return null;
  const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
  return {
    id: profile.id,
    name: name || profile.email,
    avatar: profile.avatar_url,
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