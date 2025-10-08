import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatInTimeZone } from 'date-fns-tz';
import { isPast, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getStatusStyles = (status: string) => {
  if (!status) return { tw: "bg-gray-400 text-gray-800 hover:bg-gray-400/90", hex: "#9CA3AF" };
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, "-");

  switch (normalizedStatus) {
    case "on-track":
      return { tw: "bg-teal-400 text-teal-900 hover:bg-teal-400/90 border-transparent", hex: "#4fd1c5" };
    case "at-risk":
      return { tw: "bg-orange-400 text-orange-900 hover:bg-orange-400/90 border-transparent", hex: "#f6ad55" };
    case "off-track":
      return { tw: "bg-pink-400 text-pink-900 hover:bg-pink-400/90 border-transparent", hex: "#f687b3" };
    case "on-hold":
      return { tw: "bg-gray-400 text-gray-800 hover:bg-gray-400/90 border-transparent", hex: "#a0aec0" };
    case "completed":
      return { tw: "bg-blue-500 text-white hover:bg-blue-500/90 border-transparent", hex: "#3182ce" };
    case "planning":
      return { tw: "bg-purple-500 text-white hover:bg-purple-500/90 border-transparent", hex: "#805ad5" };
    default:
      return { tw: "bg-gray-400 text-gray-800 hover:bg-gray-400/90 border-transparent", hex: "#9CA3AF" };
  }
};

export const getPaymentStatusStyles = (status: string) => {
  if (!status) return { tw: "bg-gray-400 text-gray-800 hover:bg-gray-400/90", hex: "#9CA3AF" };
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, "-");

  switch (normalizedStatus) {
    case "paid":
      return { tw: "bg-teal-400 text-teal-900 hover:bg-teal-400/90 border-transparent", hex: "#4fd1c5" };
    case "unpaid":
      return { tw: "bg-yellow-300 text-yellow-900 hover:bg-yellow-300/90 border-transparent", hex: "#faf089" };
    case "overdue":
      return { tw: "bg-pink-400 text-pink-900 hover:bg-pink-400/90 border-transparent", hex: "#f687b3" };
    default:
      return { tw: "bg-gray-400 text-gray-800 hover:bg-gray-400/90 border-transparent", hex: "#9CA3AF" };
  }
};

export const getTaskStatusStyles = (status: string) => {
  if (!status) return { tw: "bg-gray-200 text-gray-800", hex: "#E2E8F0" };
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, "-");

  switch (normalizedStatus) {
    case "to-do":
      return { tw: "bg-gray-200 text-gray-800", hex: "#E2E8F0" };
    case "in-progress":
      return { tw: "bg-blue-200 text-blue-800", hex: "#BEE3F8" };
    case "done":
      return { tw: "bg-green-200 text-green-800", hex: "#C6F6D5" };
    case "backlog":
      return { tw: "bg-purple-200 text-purple-800", hex: "#E9D8FD" };
    default:
      return { tw: "bg-gray-200 text-gray-800", hex: "#E2E8F0" };
  }
};

export const getPriorityStyles = (priority: string) => {
  if (!priority) return { tw: "text-gray-500", hex: "#6B7280" };
  const normalizedPriority = priority.toLowerCase();

  switch (normalizedPriority) {
    case "low":
      return { tw: "text-green-500", hex: "#10B981" };
    case "normal":
      return { tw: "text-yellow-500", hex: "#F59E0B" };
    case "high":
      return { tw: "text-red-500", hex: "#EF4444" };
    default:
      return { tw: "text-gray-500", hex: "#6B7280" };
  }
};

export const getInitials = (name?: string | null, fallback = "NN") => {
  if (!name) return fallback;
  const names = name.trim().split(" ");
  if (names.length > 1 && names[0] && names[names.length - 1]) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  if (name.length > 1) {
    return name.substring(0, 2).toUpperCase();
  }
  return name.toUpperCase();
};

export const generatePastelColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 70%, 80%)`;
};

export const getAvatarUrl = (avatarPath?: string | null) => {
  if (!avatarPath) return null;
  if (avatarPath.startsWith('http')) return avatarPath;
  // This is a fallback for when the Supabase URL isn't available or path is wrong
  return `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(avatarPath)}`;
};

export const formatInJakarta = (date: string | Date, formatString: string) => {
  try {
    return formatInTimeZone(date, 'Asia/Jakarta', formatString);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
};

export const isOverdue = (dueDate: string | null | undefined): boolean => {
  if (!dueDate) return false;
  try {
    const date = parseISO(dueDate);
    return isPast(date);
  } catch (error) {
    return false;
  }
};

export const formatPhoneNumberForApi = (phone: string) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

export const getColorForTag = (tagName: string) => {
  let hash = 0;
  if (!tagName || tagName.length === 0) {
    return `hsl(0, 0%, 80%)`;
  }
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; 
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 50%)`;
};