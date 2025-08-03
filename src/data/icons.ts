import { LucideIcon, Target, Flag, Book, Dumbbell, TrendingUp, Star, Heart, Rocket, DollarSign, FileText, ImageIcon, Award, BarChart, Calendar, CheckCircle, Users } from 'lucide-react';

export const allIcons = [
  'Rocket', 'DollarSign', 'FileText', 'Target', 'Award', 'BarChart', 'Calendar', 'CheckCircle', 'Flag', 'TrendingUp', 'Users', 'ImageIcon'
];

const iconMap: { [key: string]: LucideIcon } = {
  Rocket,
  DollarSign,
  FileText,
  Target,
  ImageIcon,
  Award,
  BarChart,
  Calendar,
  CheckCircle,
  Flag,
  TrendingUp,
  Users,
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