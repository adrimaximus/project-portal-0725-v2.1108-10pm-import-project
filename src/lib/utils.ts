import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStatusClass(status: string) {
  switch (status) {
    case "Completed":
    case "Paid":
    case "Done":
    case "Billed":
    case "On Track":
      return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
    case "In Progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
    case "On Hold":
    case "At Risk":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
    case "Requested":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300";
    case "Overdue":
    case "Off Track":
    case "Cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300";
  }
}