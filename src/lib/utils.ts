import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ProjectStatus, PaymentStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getStatusStyles = (status: ProjectStatus | PaymentStatus) => {
  switch (status) {
    // Status Proyek
    case 'Requested':
      return { hex: '#3B82F6', tw: 'bg-blue-100 text-blue-800' }; // biru
    case 'In Progress':
      return { hex: '#F59E0B', tw: 'bg-amber-100 text-amber-800' }; // kuning
    case 'In Review':
      return { hex: '#8B5CF6', tw: 'bg-purple-100 text-purple-800' }; // ungu
    case 'On Hold':
      return { hex: '#6B7280', tw: 'bg-gray-100 text-gray-800' }; // abu-abu
    case 'Completed':
      return { hex: '#10B981', tw: 'bg-emerald-100 text-emerald-800' }; // hijau zamrud
    case 'Cancelled':
      return { hex: '#EF4444', 'tw': 'bg-red-100 text-red-800' }; // merah
    
    // Status Pembayaran
    case 'Proposed':
      return { hex: '#A855F7', tw: 'bg-fuchsia-100 text-fuchsia-800' }; // fuchsia
    case 'Pending':
      return { hex: '#F59E0B', tw: 'bg-amber-100 text-amber-800' }; // kuning
    case 'Paid':
      return { hex: '#10B981', tw: 'bg-emerald-100 text-emerald-800' }; // hijau zamrud
    case 'Overdue':
      return { hex: '#EF4444', tw: 'bg-red-100 text-red-800' }; // merah
    
    default:
      return { hex: '#6B7280', tw: 'bg-gray-100 text-gray-800' };
  }
};