import { Rocket, DollarSign, FileText, Target, ImageIcon, Award, BarChart, Calendar, CheckCircle, Flag, TrendingUp, Users } from 'lucide-react';

export const allIcons = [
  'Rocket', 'DollarSign', 'FileText', 'Target', 'Award', 'BarChart', 'Calendar', 'CheckCircle', 'Flag', 'TrendingUp', 'Users', 'ImageIcon'
];

const iconMap: { [key: string]: React.ElementType } = {
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
};

export const getIconComponent = (name: string) => {
  return iconMap[name] || Target;
};