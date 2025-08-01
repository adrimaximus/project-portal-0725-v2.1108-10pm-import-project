import { Code, Megaphone, Bot, LineChart, Palette } from 'lucide-react';

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
    description: "SEO, SMM, and content marketing.",
    icon: Megaphone,
    iconColor: "text-orange-500",
  },
  {
    title: "AI Automation",
    description: "Integrate AI into your workflows.",
    icon: Bot,
    iconColor: "text-purple-500",
  },
  {
    title: "Data Analytics",
    description: "Insights from your business data.",
    icon: LineChart,
    iconColor: "text-green-500",
  },
  {
    title: "UI/UX Design",
    description: "User-centric and beautiful designs.",
    icon: Palette,
    iconColor: "text-pink-500",
  },
];