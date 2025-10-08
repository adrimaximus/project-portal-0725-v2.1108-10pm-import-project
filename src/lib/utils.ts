import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { isSameDay, subDays } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getAvatarUrl = (avatarUrl: string | null | undefined, seed?: string): string => {
  if (avatarUrl) {
    return avatarUrl;
  }
  return `https://api.dicebear.com/8.x/initials/svg?seed=${seed || 'default'}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&fontWeight=600`;
};

export const generatePastelColor = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return { backgroundColor: `hsl(${h}, 70%, 85%)` };
};

export const formatInJakarta = (date: string | Date, formatString: string) => {
  return format(new Date(date), formatString, { locale: id });
};