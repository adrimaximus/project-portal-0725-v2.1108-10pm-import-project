import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { TaskStatus } from "@/types";
import { isPast } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPriorityStyles(priority: string | null | undefined) {
  switch (priority) {
    case 'Urgent':
      return { tw: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-200 dark:border-red-800', hex: '#ef4444' };
    case 'High':
      return { tw: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-200 dark:border-orange-800', hex: '#f97316' };
    case 'Normal':
      return { tw: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-200 dark:border-yellow-800', hex: '#f59e0b' };
    case 'Low':
      return { tw: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600', hex: '#6b7280' };
    default:
      return { tw: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600', hex: '#6b7280' };
  }
}

export function getTaskStatusStyles(status: TaskStatus) {
  switch (status) {
    case 'To do':
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', hex: '#6b7280' };
    case 'In progress':
      return { tw: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200', hex: '#3b82f6' };
    case 'In review':
      return { tw: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200', hex: '#8b5cf6' };
    case 'Done':
      return { tw: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200', hex: '#22c55e' };
    default:
      return { tw: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', hex: '#6b7280' };
  }
}

export function isOverdue(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;
  const date = new Date(dueDate);
  if (isNaN(date.getTime())) {
    return false;
  }
  return isPast(date);
}

export function generatePastelColor(str: string): { backgroundColor: string; color: string } {
    if (!str) {
        const h = Math.floor(Math.random() * 360);
        const s = 75;
        const l = 80;
        const backgroundColor = `hsl(${h}, ${s}%, ${l}%)`;
        const textColor = l > 60 ? 'hsl(0, 0%, 10%)' : 'hsl(0, 0%, 90%)';
        return { backgroundColor, color: textColor };
    }
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    const s = 75;
    const l = 80;
    const backgroundColor = `hsl(${h}, ${s}%, ${l}%)`;
    const textColor = l > 60 ? 'hsl(0, 0%, 10%)' : 'hsl(0, 0%, 90%)';
    return { backgroundColor, color: textColor };
}

export function getInitials(name?: string, fallbackEmail?: string): string {
  if (name && name.trim()) {
    const nameParts = name.trim().split(' ');
    if (nameParts.length > 1 && nameParts[nameParts.length - 1]) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    if (nameParts[0] && nameParts[0].length > 1) {
      return nameParts[0].substring(0, 2).toUpperCase();
    }
    if (nameParts[0] && nameParts[0].length > 0) {
      return nameParts[0][0].toUpperCase();
    }
  }
  if (fallbackEmail) {
    return fallbackEmail.substring(0, 2).toUpperCase();
  }
  return 'NN';
}

export function getAvatarUrl(avatarUrl: string | null | undefined, seed: string): string {
  if (avatarUrl) {
    return avatarUrl;
  }
  return `https://api.dicebear.com/8.x/micah/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}