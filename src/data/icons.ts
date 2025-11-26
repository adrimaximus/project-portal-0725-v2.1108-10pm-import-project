import type { ElementType } from 'react';
import { 
  LucideIcon, Activity, Anchor, Aperture, Award, BarChart, Bike, BookOpen, Briefcase, Brush, Calendar, Camera, Car, CheckCircle, ClipboardCheck, Cloud, Code, Coffee, Compass, Cpu, CreditCard, Crown, Database, Diamond, DollarSign, Dumbbell, Feather, FileText, Film, Flag, Flame, Flower, Gamepad2, Gift, Globe, GraduationCap, Guitar, HardDrive, Headphones, Heart, Home, Image as ImageIcon, Key, Laptop, Leaf, Lightbulb, Link, Map, Medal, Megaphone, Mic, Monitor, Moon, MountainSnow, MousePointer, Music, Paintbrush, Palette, PenTool, Phone, PieChart, Plane, Puzzle, Receipt, Rocket, Save, Scale, Scissors, Search, Settings, Shield, Ship, ShoppingBag, Smile, Smartphone, Speaker, Sprout, Star, Sun, Sunrise, Sunset, Sword, Tag, Target, Tent, TrainFront, TreePine, TrendingUp, Trophy, Truck, Umbrella, Users, Utensils, Video, Volleyball, Wallet, Watch, Waves, Wind, Wine, Wrench, Zap
} from 'lucide-react';
import * as HugeIcons from 'hugeicons-react';

// A curated list of icons for goals
const lucideIconNames = [
  'Activity', 'Anchor', 'Aperture', 'Award', 'BarChart', 'Bike', 'BookOpen', 'Briefcase', 'Brush', 'Calendar', 'Camera', 'Car', 'CheckCircle', 'ClipboardCheck', 'Cloud', 'Code', 'Coffee', 'Compass', 'Cpu', 'CreditCard', 'Crown', 'Database', 'Diamond', 'DollarSign', 'Dumbbell', 'Feather', 'FileText', 'Film', 'Flag', 'Flame', 'Flower', 'Gamepad2', 'Gift', 'Globe', 'GraduationCap', 'Guitar', 'HardDrive', 'Headphones', 'Heart', 'Home', 'ImageIcon', 'Key', 'Laptop', 'Leaf', 'Lightbulb', 'Link', 'Map', 'Medal', 'Megaphone', 'Mic', 'Monitor', 'Moon', 'MountainSnow', 'MousePointer', 'Music', 'Paintbrush', 'Palette', 'PenTool', 'Phone', 'PieChart', 'Plane', 'Puzzle', 'Receipt', 'Rocket', 'Save', 'Scale', 'Scissors', 'Search', 'Settings', 'Shield', 'Ship', 'ShoppingBag', 'Smile', 'Smartphone', 'Speaker', 'Sprout', 'Star', 'Sun', 'Sunrise', 'Sunset', 'Sword', 'Tag', 'Target', 'Tent', 'TrainFront', 'TreePine', 'TrendingUp', 'Trophy', 'Truck', 'Umbrella', 'Users', 'Utensils', 'Video', 'Volleyball', 'Wallet', 'Watch', 'Waves', 'Wind', 'Wine', 'Wrench', 'Zap'
];

const lucideIconMap: { [key: string]: LucideIcon } = {
  Activity, Anchor, Aperture, Award, BarChart, Bike, BookOpen, Briefcase, Brush, Calendar, Camera, Car, CheckCircle, ClipboardCheck, Cloud, Code, Coffee, Compass, Cpu, CreditCard, Crown, Database, Diamond, DollarSign, Dumbbell, Feather, FileText, Film, Flag, Flame, Flower, Gamepad2, Gift, Globe, GraduationCap, Guitar, HardDrive, Headphones, Heart, Home, ImageIcon, Key, Laptop, Leaf, Lightbulb, Link, Map, Medal, Megaphone, Mic, Monitor, Moon, MountainSnow, MousePointer, Music, Paintbrush, Palette, PenTool, Phone, PieChart, Plane, Puzzle, Receipt, Rocket, Save, Scale, Scissors, Search, Settings, Shield, Ship, ShoppingBag, Smile, Smartphone, Speaker, Sprout, Star, Sun, Sunrise, Sunset, Sword, Tag, Target, Tent, TrainFront, TreePine, TrendingUp, Trophy, Truck, Umbrella, Users, Utensils, Video, Volleyball, Wallet, Watch, Waves, Wind, Wine, Wrench, Zap
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