import { Code, Megaphone, PenTool, Search, Bot } from 'lucide-react';

export type Service = {
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
};

export const services: Service[] = [
  {
    title: "Web Development",
    description: "Custom websites and web applications.",
    icon: Code,
    iconColor: "text-blue-500",
  },
  {
    title: "Digital Marketing",
    description: "SEO, SMM, and content marketing strategies.",
    icon: Megaphone,
    iconColor: "text-green-500",
  },
  {
    title: "UI/UX Design",
    description: "User-centric and beautiful interface designs.",
    icon: PenTool,
    iconColor: "text-purple-500",
  },
  {
    title: "SEO Optimization",
    description: "Improve your search engine rankings.",
    icon: Search,
    iconColor: "text-orange-500",
  },
  {
    title: "AI Integration",
    description: "Leverage AI to automate and enhance.",
    icon: Bot,
    iconColor: "text-teal-500",
  },
];