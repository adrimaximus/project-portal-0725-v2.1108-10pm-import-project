import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { TaskPriority, TaskStatus } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getInitials = (name?: string | null, fallback = 'NN') => {
  if (!name) return fallback;
  const nameParts = name.trim().split(' ');
  if (nameParts.length > 1 && nameParts[0] && nameParts[nameParts.length - 1]) {
    return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
  }
  if (nameParts[0] && nameParts[0].length > 1) {
    return nameParts[0].substring(0, 2).toUpperCase();
  }
  if (nameParts[0] && nameParts[0].length > 0) {
    return nameParts[0][0].toUpperCase();
  }
  return fallback;
};

export const getAvatarUrl = (avatarUrl: string | null | undefined, seed: string) => {
  if (avatarUrl) return avatarUrl;
  return `https://api.dicebear.com/8.x/micah/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
};

export const generatePastelColor = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return { backgroundColor: `hsl(${h}, 70%, 90%)`, color: `hsl(${h}, 70%, 30%)` };
};

export function getPriorityStyles(priority?: TaskPriority | null) {
  switch (priority) {
    case 'Urgent':
      return {
        tw: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-700/50',
        hex: '#ef4444', // red-500
      };
    case 'High':
      return {
        tw: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-700/50',
        hex: '#f97316', // orange-500
      };
    case 'Normal':
      return {
        tw: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
        hex: '#6b7280', // gray-500
      };
    case 'Low':
      return {
        tw: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300 border-sky-200 dark:border-sky-700/50',
        hex: '#0ea5e9', // sky-500
      };
    default:
      return {
        tw: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
        hex: '#6b7280', // gray-500
      };
  }
}

export function getTaskStatusStyles(status?: TaskStatus | null) {
  switch (status) {
    case 'To do':
      return { tw: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200', hex: '#9ca3af' };
    case 'In progress':
      return { tw: 'bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', hex: '#3b82f6' };
    case 'In review':
      return { tw: 'bg-purple-200 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300', hex: '#8b5cf6' };
    case 'Done':
      return { tw: 'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300', hex: '#22c55e' };
    default:
      return { tw: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200', hex: '#9ca3af' };
  }
}

export function truncateText(text: string, maxLength: number) {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}