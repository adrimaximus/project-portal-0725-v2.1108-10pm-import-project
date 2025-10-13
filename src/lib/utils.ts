import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name?: string, fallback?: string): string {
  if (!name && !fallback) return 'NN';
  const targetName = name || fallback || '';
  if (targetName.includes(' ')) {
    const parts = targetName.split(' ').filter(p => p.length > 0);
    const first = parts[0] ? parts[0][0] : '';
    const last = parts.length > 1 && parts[parts.length - 1] ? parts[parts.length - 1][0] : '';
    return `${first}${last}`.toUpperCase();
  }
  return targetName.substring(0, 2).toUpperCase();
}

export function generatePastelColor(seed: string): React.CSSProperties {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return { backgroundColor: `hsl(${h}, 70%, 80%)` };
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}