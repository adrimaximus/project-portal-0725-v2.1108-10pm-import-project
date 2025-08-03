import { LucideIcon, Target, Flag, Book, Dumbbell, TrendingUp, Star, Heart } from 'lucide-react';

export const iconList = [
  { value: 'target', label: 'Target' },
  { value: 'flag', label: 'Flag' },
  { value: 'book', label: 'Book' },
  { value: 'dumbbell', label: 'Dumbbell' },
  { value: 'trending-up', label: 'Trending Up' },
  { value: 'star', label: 'Star' },
  { value: 'heart', label: 'Heart' },
];

const iconMap: { [key: string]: LucideIcon } = {
  target: Target,
  flag: Flag,
  book: Book,
  dumbbell: Dumbbell,
  'trending-up': TrendingUp,
  star: Star,
  heart: Heart,
};

export const getIconComponent = (iconName: string): LucideIcon => {
  return iconMap[iconName] || Target; // Default to Target icon
};