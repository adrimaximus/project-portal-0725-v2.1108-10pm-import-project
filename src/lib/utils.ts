import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeFormatDistanceToNow(date: string | Date | undefined | null): string {
  if (!date) {
    return '';
  }
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: id });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

export function getInitials(name?: string, fallback?: string): string {
  if (!name) return fallback ? fallback.slice(0, 2).toUpperCase() : 'NN';
  const nameParts = name.split(' ');
  if (nameParts.length > 1) {
    return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function generatePastelColor(seed: string): { backgroundColor: string; color: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  const s = 70; // saturation
  const l = 80; // lightness
  const backgroundColor = `hsl(${h}, ${s}%, ${l}%)`;
  const color = `hsl(${h}, ${s}%, 20%)`; // Darker color for text
  return { backgroundColor, color };
}

export function formatMentionsForDisplay(text: string): string {
  // This is a simplified version. A real implementation might need more robust parsing.
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  return text.replace(mentionRegex, (match, name, id) => `**${name}**`);
}

export function getAvatarUrl(avatarUrl: string | null | undefined, seed: string): string {
  if (avatarUrl) {
    return avatarUrl;
  }
  const colors = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return `https://api.dicebear.com/8.x/micah/svg?seed=${seed}&backgroundColor=${color}`;
}