import { LucideIcon, Briefcase, Palette, Megaphone, Code, Settings, Shield, Package, Brain, PenTool } from "lucide-react";

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  price: number;
  category: string;
}

export const services: Service[] = [
  {
    id: 's0',
    title: "End to End Services",
    description: "Comprehensive package covering all project needs from start to finish.",
    icon: Shield,
    iconColor: "bg-yellow-100 text-yellow-600",
    price: 150000000,
    category: "Package"
  },
  {
    id: 's1',
    title: "Project Management",
    description: "Dedicated project managers to ensure your project stays on track.",
    icon: Briefcase,
    iconColor: "bg-blue-100 text-blue-600",
    price: 20000000,
    category: "Management"
  },
  {
    id: 's2',
    title: "UI/UX Design",
    description: "Creating intuitive and beautiful user interfaces.",
    icon: Palette,
    iconColor: "bg-purple-100 text-purple-600",
    price: 30000000,
    category: "Design"
  },
  {
    id: 's3',
    title: "Development",
    description: "Bringing your designs to life with clean, efficient code.",
    icon: Code,
    iconColor: "bg-green-100 text-green-600",
    price: 75000000,
    category: "Development"
  },
  {
    id: 's4',
    title: "Marketing",
    description: "Promoting your project to the right audience.",
    icon: Megaphone,
    iconColor: "bg-pink-100 text-pink-600",
    price: 25000000,
    category: "Marketing"
  },
  {
    id: 's5',
    title: "Branding",
    description: "Logo, style guide, and brand identity.",
    icon: Package,
    iconColor: "bg-indigo-100 text-indigo-600",
    price: 35000000,
    category: "Design"
  },
  {
    id: 's6',
    title: "Consulting",
    description: "Expert advice to guide your project strategy.",
    icon: Brain,
    iconColor: "bg-red-100 text-red-600",
    price: 10000000,
    category: "Strategy"
  },
  {
    id: 's7',
    title: "Copywriting",
    description: "Crafting compelling content for your project.",
    icon: PenTool,
    iconColor: "bg-gray-100 text-gray-600",
    price: 12000000,
    category: "Content"
  },
];