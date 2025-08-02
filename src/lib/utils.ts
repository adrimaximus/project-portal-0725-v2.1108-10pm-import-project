import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getStatusClass = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'in progress':
      return 'bg-blue-100 text-blue-800';
    case 'on hold':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getPaymentStatusClass = (status: string) => {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'overdue':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
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