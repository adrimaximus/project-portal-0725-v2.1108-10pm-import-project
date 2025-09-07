import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { isPast as isPastDate, endOfDay } from 'date-fns';
import { format as formatTz, toZonedTime } from 'date-fns-tz';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getAvatarUrl = (avatarUrl: string | null | undefined, seed: string): string => {
  if (avatarUrl) {
    return avatarUrl;
  }
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
};

export const generatePastelColor = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return { backgroundColor: `hsl(${h}, 70%, 90%)`, color: `hsl(${h}, 70%, 30%)` };
};

export const getStatusColor = (status: string) => {
  const statusColors: { [key: string]: { color: string; } } = {
    'On Track': { color: '#16a34a' },
    'Completed': { color: '#16a34a' },
    'Done': { color: '#16a34a' },
    'At Risk': { color: '#f97316' },
    'Off Track': { color: '#dc2626' },
    'On Hold': { color: '#64748b' },
    'To Do': { color: '#64748b' },
    'In Progress': { color: '#2563eb' },
    'Default': { color: '#64748b' },
  };

  const style = statusColors[status] || statusColors['Default'];
  return {
    color: style.color,
    borderColor: style.color,
    backgroundColor: `${style.color}1A`, // 10% opacity
  };
};

export const getInitials = (firstName?: string | null, lastName?: string | null, fullName?: string | null, email?: string | null): string => {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  if (fullName) {
    const names = fullName.split(' ');
    if (names.length > 1) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return 'NN';
};

export const getStatusStyles = (status: string) => {
  const styles: { [key: string]: { color: string; backgroundColor: string; borderColor: string; } } = {
    'On Track': { color: '#16a34a', backgroundColor: '#dcfce7', borderColor: '#bbf7d0' },
    'Completed': { color: '#16a34a', backgroundColor: '#dcfce7', borderColor: '#bbf7d0' },
    'Done': { color: '#16a34a', backgroundColor: '#dcfce7', borderColor: '#bbf7d0' },
    'At Risk': { color: '#f97316', backgroundColor: '#ffedd5', borderColor: '#fed7aa' },
    'Off Track': { color: '#dc2626', backgroundColor: '#fee2e2', borderColor: '#fecaca' },
    'On Hold': { color: '#64748b', backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
    'To Do': { color: '#64748b', backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
    'In Progress': { color: '#2563eb', backgroundColor: '#dbeafe', borderColor: '#bfdbfe' },
    'Default': { color: '#64748b', backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
  };
  return styles[status] || styles['Default'];
};

export const getPaymentStatusStyles = (status: string) => {
    const styles: { [key: string]: { color: string; backgroundColor: string; } } = {
        'Paid': { color: '#16a34a', backgroundColor: '#dcfce7' },
        'Unpaid': { color: '#dc2626', backgroundColor: '#fee2e2' },
        'Partially Paid': { color: '#f97316', backgroundColor: '#ffedd5' },
        'Overdue': { color: '#e11d48', backgroundColor: '#ffe4e6' },
        'Default': { color: '#64748b', backgroundColor: '#f1f5f9' },
    };
    return styles[status] || styles['Default'];
};

export const formatInJakarta = (date: Date | string | number, formatString: string = 'dd MMM yyyy, HH:mm'): string => {
  try {
    const timeZone = 'Asia/Jakarta';
    const zonedDate = toZonedTime(date, timeZone);
    return formatTz(zonedDate, formatString, { timeZone });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
};

export const getPriorityStyles = (priority: string) => {
    const styles: { [key: string]: { color: string; iconColor: string; } } = {
        'Urgent': { color: 'text-red-600', iconColor: 'text-red-500' },
        'High': { color: 'text-orange-600', iconColor: 'text-orange-500' },
        'Normal': { color: 'text-blue-600', iconColor: 'text-blue-500' },
        'Low': { color: 'text-gray-600', iconColor: 'text-gray-500' },
        'Default': { color: 'text-gray-600', iconColor: 'text-gray-500' },
    };
    return styles[priority] || styles['Default'];
};

export const getTaskStatusStyles = (status: string) => {
    const styles: { [key: string]: { color: string; backgroundColor: string; } } = {
        'To do': { color: '#64748b', backgroundColor: '#f1f5f9' },
        'In progress': { color: '#2563eb', backgroundColor: '#dbeafe' },
        'In review': { color: '#ca8a04', backgroundColor: '#fef9c3' },
        'Done': { color: '#16a34a', backgroundColor: '#dcfce7' },
        'Default': { color: '#64748b', backgroundColor: '#f1f5f9' },
    };
    return styles[status] || styles['Default'];
};

export const isOverdue = (dueDate: string | Date | null | undefined): boolean => {
  if (!dueDate) return false;
  return isPastDate(endOfDay(new Date(dueDate)));
};

export const getInstagramUsername = (url: string): string | null => {
  if (!url) return null;
  try {
    const urlObject = new URL(url);
    if (urlObject.hostname.includes('instagram.com')) {
      const pathParts = urlObject.pathname.split('/').filter(part => part);
      return pathParts[0] || null;
    }
  } catch (e) {
    // Not a valid URL, maybe it's just a username
    if (!url.includes('/') && !url.includes('.')) {
      return url;
    }
  }
  return null;
};

export const getColorForTag = (tagName: string): { backgroundColor: string; textColor: string } => {
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return {
    backgroundColor: `hsl(${h}, 90%, 95%)`,
    textColor: `hsl(${h}, 70%, 30%)`,
  };
};