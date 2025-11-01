import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, utcToZonedTime } from 'date-fns-tz';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getProjectStatusStyles(status: string) {
  switch (status) {
    case "Completed":
      return { hex: "#22c55e", tw: "bg-green-100 text-green-800 border-green-200" };
    case "In Progress":
      return { hex: "#3b82f6", tw: "bg-blue-100 text-blue-800 border-blue-200" };
    case "On Hold":
      return { hex: "#f97316", tw: "bg-orange-100 text-orange-800 border-orange-200" };
    case "Reschedule":
      return { hex: "#eab308", tw: "bg-yellow-100 text-yellow-800 border-yellow-200" };
    case "Cancelled":
      return { hex: "#ef4444", tw: "bg-red-100 text-red-800 border-red-200" };
    case "Bid Lost":
      return { hex: "#dc2626", tw: "bg-red-200 text-red-900 border-red-300" };
    case "Requested":
      return { hex: "#60a5fa", tw: "bg-sky-100 text-sky-800 border-sky-200" };
    case "Archived":
    default:
      return { hex: "#64748b", tw: "bg-slate-100 text-slate-800 border-slate-200" };
  }
}

export function getPaymentStatusStyles(status: string) {
  switch (status) {
    case 'Paid':
      return { tw: 'bg-green-100 text-green-800' };
    case 'Partially Paid':
      return { tw: 'bg-yellow-100 text-yellow-800' };
    case 'Overdue':
      return { tw: 'bg-red-100 text-red-800' };
    case 'Unpaid':
    default:
      return { tw: 'bg-gray-100 text-gray-800' };
  }
}

export const formatInJakarta = (date: string | Date, formatString: string) => {
  const timeZone = 'Asia/Jakarta';
  const zonedDate = utcToZonedTime(date, timeZone);
  return format(zonedDate, formatString, { timeZone });
};

export const getErrorMessage = (error: any, defaultMessage = "An unexpected error occurred.") => {
  if (typeof error === 'string') return error;
  if (error && typeof error.message === 'string') return error.message;
  return defaultMessage;
};