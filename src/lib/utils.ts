import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStatusClass(status: string) {
  switch (status) {
    case 'On Track':
    case 'Completed':
    case 'Done':
    case 'Billed':
      return 'bg-green-100 text-green-800';
    case 'At Risk':
      return 'bg-yellow-100 text-yellow-800';
    case 'Off Track':
    case 'Cancelled':
      return 'bg-red-100 text-red-800';
    case 'On Hold':
    case 'In Progress':
      return 'bg-blue-100 text-blue-800';
    case 'Requested':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getPaymentStatusClass(status: string) {
  switch (status?.toLowerCase()) {
    case 'paid':
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'pending':
    case 'po_created':
    case 'on_process':
    case 'proposed':
      return 'bg-yellow-100 text-yellow-800';
    case 'overdue':
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function formatFileSize(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}