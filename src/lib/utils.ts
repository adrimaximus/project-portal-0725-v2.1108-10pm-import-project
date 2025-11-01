import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ProjectStatus, PaymentStatus } from "@/types";
import { format as formatFns, toZonedTime } from 'date-fns-tz';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getProjectStatusStyles = (status: ProjectStatus) => {
  switch (status) {
    case 'On Track':
      return { tw: 'bg-green-100 text-green-800', hex: '#22c55e' };
    case 'At Risk':
      return { tw: 'bg-yellow-100 text-yellow-800', hex: '#f59e0b' };
    case 'Off Track':
      return { tw: 'bg-red-100 text-red-800', hex: '#ef4444' };
    case 'On Hold':
      return { tw: 'bg-gray-100 text-gray-800', hex: '#6b7280' };
    case 'Completed':
      return { tw: 'bg-blue-100 text-blue-800', hex: '#3b82f6' };
    case 'Cancelled':
      return { tw: 'bg-gray-100 text-gray-800 line-through', hex: '#6b7280' };
    case 'Bid Lost':
        return { tw: 'bg-gray-100 text-gray-800 line-through', hex: '#6b7280' };
    default:
      return { tw: 'bg-gray-100 text-gray-800', hex: '#6b7280' };
  }
};

export const getPaymentStatusStyles = (status: PaymentStatus) => {
  switch (status) {
    case 'Paid':
      return { tw: 'bg-green-100 text-green-800', hex: '#22c55e' };
    case 'Overdue':
      return { tw: 'bg-red-100 text-red-800', hex: '#ef4444' };
    case 'Partially Paid':
      return { tw: 'bg-yellow-100 text-yellow-800', hex: '#f59e0b' };
    case 'Pending':
      return { tw: 'bg-blue-100 text-blue-800', hex: '#3b82f6' };
    case 'In Process':
      return { tw: 'bg-purple-100 text-purple-800', hex: '#8b5cf6' };
    case 'Requested':
      return { tw: 'bg-gray-100 text-gray-800', hex: '#6b7280' };
    case 'Proposed':
      return { tw: 'bg-indigo-100 text-indigo-800', hex: '#6366f1' };
    case 'Quo Approved':
      return { tw: 'bg-teal-100 text-teal-800', hex: '#14b8a6' };
    case 'Inv Approved':
      return { tw: 'bg-emerald-100 text-emerald-800', hex: '#10b981' };
    case 'Cancelled':
      return { tw: 'bg-gray-100 text-gray-800', hex: '#6b7280' };
    case 'Bid Lost':
      return { tw: 'bg-gray-100 text-gray-800', hex: '#6b7280' };
    default:
      return { tw: 'bg-gray-100 text-gray-800', hex: '#6b7280' };
  }
};

export const formatInJakarta = (date: Date | string, formatString: string) => {
  const timeZone = 'Asia/Jakarta';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const zonedDate = toZonedTime(dateObj, timeZone);
  return formatFns(zonedDate, formatString, { timeZone });
};