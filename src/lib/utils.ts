import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ProjectStatus, PaymentStatus } from "@/data/projects";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getStatusClass = (status: ProjectStatus) => {
  switch (status) {
    case 'On Track':
    case 'Completed':
    case 'Done':
      return 'bg-green-100 text-green-800';
    case 'At Risk':
      return 'bg-yellow-100 text-yellow-800';
    case 'Off Track':
      return 'bg-red-100 text-red-800';
    case 'On Hold':
    case 'In Progress':
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getPaymentStatusClass = (status: PaymentStatus) => {
  switch (status) {
    case 'Paid':
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'Partially Paid':
    case 'approved':
      return 'bg-yellow-100 text-yellow-800';
    case 'Unpaid':
      return 'bg-red-100 text-red-800';
    case 'Overdue':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};