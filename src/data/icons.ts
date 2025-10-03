import type { ElementType } from 'react';
import { 
  LucideIcon, Target, Flag, BookOpen, Dumbbell, TrendingUp, Star, Heart, Rocket, DollarSign, FileText, Image as ImageIcon, Award, BarChart, Calendar, CheckCircle, Users,
  Activity, Anchor, Aperture, Bike, Briefcase, Brush, Camera, Car, ClipboardCheck, Cloud, Code, Coffee, Compass, Cpu, CreditCard, Crown, Database, Diamond, Feather, Film, Flame, Flower, Gift, Globe, GraduationCap, Headphones, Home, Key, Laptop, Leaf, Lightbulb, Link, Map, Medal, Mic, Moon, MousePointer, Music, Paintbrush, Palette, PenTool, Phone, PieChart, Plane, Puzzle, Save, Scale, Scissors, Settings, Shield, ShoppingBag, Smile, Speaker, Sun, Sunrise, Sunset, Sword, Tag, Trophy, Truck, Umbrella, Video, Wallet, Watch, Wind, Wrench, Zap
} from 'lucide-react';
import * as HugeIcons from 'hugeicons-react';

// A curated list of icons for goals
const lucideIconNames = [
  'Target', 'Flag', 'BookOpen', 'Dumbbell', 'TrendingUp', 'Star', 'Heart', 'Rocket', 'DollarSign', 'FileText', 'ImageIcon', 'Award', 'BarChart', 'Calendar', 'CheckCircle', 'Users',
  'Activity', 'Anchor', 'Aperture', 'Bike', 'Briefcase', 'Brush', 'Camera', 'Car', 'ClipboardCheck', 'Cloud', 'Code', 'Coffee', 'Compass', 'Cpu', 'CreditCard', 'Crown', 'Database', 'Diamond', 'Feather', 'Film', 'Flame', 'Flower', 'Gift', 'Globe', 'GraduationCap', 'Headphones', 'Home', 'Key', 'Laptop', 'Leaf', 'Lightbulb', 'Link', 'Map', 'Medal', 'Mic', 'Moon', 'MousePointer', 'Music', 'Paintbrush', 'Palette', 'PenTool', 'Phone', 'PieChart', 'Plane', 'Puzzle', 'Save', 'Scale', 'Scissors', 'Settings', 'Shield', 'ShoppingBag', 'Smile', 'Speaker', 'Sun', 'Sunrise', 'Sunset', 'Sword', 'Tag', 'Trophy', 'Truck', 'Umbrella', 'Video', 'Wallet', 'Watch', 'Wind', 'Wrench', 'Zap'
];

const lucideIconMap: { [key: string]: LucideIcon } = {
  Target, Flag, BookOpen, Dumbbell, TrendingUp, Star, Heart, Rocket, DollarSign, FileText, ImageIcon, Award, BarChart, Calendar, CheckCircle, Users,
  Activity, Anchor, Aperture, Bike, Briefcase, Brush, Camera, Car, ClipboardCheck, Cloud, Code, Coffee, Compass, Cpu, CreditCard, Crown, Database, Diamond, Feather, Film, Flame, Flower, Gift, Globe, GraduationCap, Headphones, Home, Key, Laptop, Leaf, Lightbulb, Link, Map, Medal, Mic, Moon, MousePointer, Music, Paintbrush, Palette, PenTool, Phone, PieChart, Plane, Puzzle, Save, Scale, Scissors, Settings, Shield, ShoppingBag, Smile, Speaker, Sun, Sunrise, Sunset, Sword, Tag, Trophy, Truck, Umbrella, Video, Wallet, Watch, Wind, Wrench, Zap
};

const { icons, createHugeiconComponent, ...hugeIconComponents } = HugeIcons;
const hugeIconNames = Object.keys(hugeIconComponents);

export const allIcons = [...lucideIconNames, ...hugeIconNames].sort();

const iconMap: { [key: string]: ElementType } = {
  ...lucideIconMap,
  ...hugeIconComponents,
};

export const getIconComponent = (iconName: string): ElementType => {
  return iconMap[iconName] || Target; // Default to Target icon
};