import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getStatusStyles = (status: string | undefined | null) => {
  if (!status) {
    return {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-800 dark:text-gray-300',
      border: 'border-l-gray-500',
      hex: '#6b7280', // gray-500
    };
  }

  switch (status.toLowerCase()) {
    // Positive statuses (Green)
    case 'on track':
    case 'completed':
    case 'done':
    case 'billed':
    case 'paid':
      return {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-800 dark:text-green-300',
        border: 'border-l-green-500',
        hex: '#22c55e', // green-500
      };
    
    // Warning statuses (Yellow/Amber)
    case 'at risk':
    case 'on hold':
    case 'pending':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-800 dark:text-yellow-300',
        border: 'border-l-yellow-500',
        hex: '#eab308', // yellow-500
      };

    // Negative statuses (Red)
    case 'off track':
    case 'cancelled':
    case 'overdue':
      return {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-800 dark:text-red-300',
        border: 'border-l-red-500',
        hex: '#ef4444', // red-500
      };

    // Informational statuses (Blue)
    case 'in progress':
    case 'requested':
    case 'proposed':
    case 'approved':
    case 'po created':
    case 'on process':
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-800 dark:text-blue-300',
        border: 'border-l-blue-500',
        hex: '#3b82f6', // blue-500
      };

    // Default (Gray)
    default:
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-800 dark:text-gray-300',
        border: 'border-l-gray-500',
        hex: '#6b7280', // gray-500
      };
  }
};

const tagColors = [
  { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-800 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
  { bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-800 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-800' },
  { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-800 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
  { bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-800 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  { bg: 'bg-pink-100 dark:bg-pink-900/50', text: 'text-pink-800 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-800' },
  { bg: 'bg-indigo-100 dark:bg-indigo-900/50', text: 'text-indigo-800 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
];

const simpleHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

export const getColorForTag = (tag: string) => {
  const hash = simpleHash(tag);
  return tagColors[hash % tagColors.length];
};