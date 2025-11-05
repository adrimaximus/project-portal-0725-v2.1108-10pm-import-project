import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { User } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAvatarUrl(avatarUrl: string | null | undefined, userId: string): string {
  if (avatarUrl) {
    // Assuming avatarUrl is a relative path to a file in the 'avatars' bucket
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${avatarUrl}`;
  }
  // Fallback or default avatar logic can be implemented here if needed
  return `https://api.dicebear.com/6.x/initials/svg?seed=${userId}`;
}

export function generatePastelColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return { backgroundColor: `hsl(${h}, 40%, 85%)` };
}

export function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return '??';
}

export function formatMentionsForDisplay(text: string): string {
  return text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '<span class="bg-blue-100 text-blue-800 rounded px-1">@$1</span>');
}

export function formatMentionsForStorage(text: string, members: User[]): string {
  let storedText = text;
  const mentionRegex = /@(\w+(\s\w+)?)/g;
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    const mention = match[0];
    const name = match[1];
    const member = members.find(m => `${m.first_name} ${m.last_name}`.trim() === name.trim() || m.first_name === name.trim());
    if (member) {
      storedText = storedText.replace(mention, `@[${name}](${member.id})`);
    }
  }
  return storedText;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength)}...`;
}