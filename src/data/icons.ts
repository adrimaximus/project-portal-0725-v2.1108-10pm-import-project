import { 
  LucideIcon,
  Target, TrendingUp, Users, CheckCircle, Award, BarChart, Activity, Bike, BookOpen, 
  Brain, Calendar, Dumbbell, Flame, Heart, Leaf, Moon, PenTool, Footprints, Smile, Sunrise, Wallet, Zap,
  Coffee, Code, DollarSign, GraduationCap, Headphones, MapPin, Paintbrush, Plane, ShoppingCart, Utensils
} from "lucide-react";

export const iconList = [
  { name: 'Target', component: Target },
  { name: 'TrendingUp', component: TrendingUp },
  { name: 'Users', component: Users },
  { name: 'CheckCircle', component: CheckCircle },
  { name: 'Award', component: Award },
  { name: 'BarChart', component: BarChart },
  { name: 'Activity', component: Activity },
  { name: 'Bike', component: Bike },
  { name: 'BookOpen', component: BookOpen },
  { name: 'Brain', component: Brain },
  { name: 'Calendar', component: Calendar },
  { name: 'Dumbbell', component: Dumbbell },
  { name: 'Flame', component: Flame },
  { name: 'Heart', component: Heart },
  { name: 'Leaf', component: Leaf },
  { name: 'Moon', component: Moon },
  { name: 'PenTool', component: PenTool },
  { name: 'Footprints', component: Footprints },
  { name: 'Smile', component: Smile },
  { name: 'Sunrise', component: Sunrise },
  { name: 'Wallet', component: Wallet },
  { name: 'Zap', component: Zap },
  { name: 'Coffee', component: Coffee },
  { name: 'Code', component: Code },
  { name: 'DollarSign', component: DollarSign },
  { name: 'GraduationCap', component: GraduationCap },
  { name: 'Headphones', component: Headphones },
  { name: 'MapPin', component: MapPin },
  { name: 'Paintbrush', component: Paintbrush },
  { name: 'Plane', component: Plane },
  { name: 'ShoppingCart', component: ShoppingCart },
  { name: 'Utensils', component: Utensils },
];

export const iconComponents: { [key: string]: LucideIcon } = iconList.reduce((acc, curr) => {
  acc[curr.name] = curr.component;
  return acc;
}, {} as { [key: string]: LucideIcon });

export const getIconComponent = (name: string): LucideIcon => {
  return iconComponents[name] || Target;
};