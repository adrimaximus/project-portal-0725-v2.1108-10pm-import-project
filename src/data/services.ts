import {
  LucideIcon,
  Calendar,
  Box,
  Home,
  Trophy,
  Palette,
  Clapperboard,
  Globe,
  Music,
  Utensils,
  Truck,
  Shield,
  Building2,
} from "lucide-react";

export type Service = {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
};

export const services: Service[] = [
  {
    title: "End to End Services",
    description: "Comprehensive event management and production services",
    icon: Calendar,
    iconColor: "text-purple-600 bg-purple-100",
  },
  {
    title: "3D Graphic Design",
    description: "Three-dimensional graphics and modeling",
    icon: Box,
    iconColor: "text-blue-600 bg-blue-100",
  },
  {
    title: "Accommodation",
    description: "Lodging and accommodation arrangements",
    icon: Home,
    iconColor: "text-green-600 bg-green-100",
  },
  {
    title: "Award Ceremony",
    description: "Recognition and celebration events",
    icon: Trophy,
    iconColor: "text-orange-600 bg-orange-100",
  },
  {
    title: "Branding",
    description: "Brand identity and creative services",
    icon: Palette,
    iconColor: "text-purple-600 bg-purple-100",
  },
  {
    title: "Content Creation",
    description: "Event content production",
    icon: Clapperboard,
    iconColor: "text-blue-600 bg-blue-100",
  },
  {
    title: "Digital Marketing",
    description: "Online promotion and social media",
    icon: Globe,
    iconColor: "text-green-600 bg-green-100",
  },
  {
    title: "Entertainment",
    description: "Live performances and shows",
    icon: Music,
    iconColor: "text-orange-600 bg-orange-100",
  },
  {
    title: "Food & Beverage",
    description: "Catering and dining services",
    icon: Utensils,
    iconColor: "text-red-600 bg-red-100",
  },
  {
    title: "Logistics",
    description: "Event logistics and material handling",
    icon: Truck,
    iconColor: "text-blue-600 bg-blue-100",
  },
  {
    title: "Professional Security",
    description: "Comprehensive event security services",
    icon: Shield,
    iconColor: "text-red-600 bg-red-100",
  },
  {
    title: "Venue",
    description: "Comprehensive venue selection and management",
    icon: Building2,
    iconColor: "text-green-600 bg-green-100",
  },
];