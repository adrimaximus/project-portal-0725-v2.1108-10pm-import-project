import { Code, Palette, Megaphone, Search, Cloud, Briefcase } from "lucide-react";

export interface Service {
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
}

export const services: Service[] = [
  {
    title: "Web Development",
    description: "Crafting responsive and high-performance websites.",
    icon: Code,
    iconColor: "bg-blue-100 text-blue-600",
  },
  {
    title: "UI/UX Design",
    description: "Designing intuitive and beautiful user interfaces.",
    icon: Palette,
    iconColor: "bg-purple-100 text-purple-600",
  },
  {
    title: "Digital Marketing",
    description: "Promoting brands and products to a target audience.",
    icon: Megaphone,
    iconColor: "bg-green-100 text-green-600",
  },
  {
    title: "SEO Optimization",
    description: "Improving website visibility on search engines.",
    icon: Search,
    iconColor: "bg-yellow-100 text-yellow-600",
  },
  {
    title: "Cloud Services",
    description: "Providing scalable and secure cloud infrastructure.",
    icon: Cloud,
    iconColor: "bg-sky-100 text-sky-600",
  },
  {
    title: "IT Consulting",
    description: "Offering expert advice on technology strategies.",
    icon: Briefcase,
    iconColor: "bg-red-100 text-red-600",
  },
  {
    title: "Mobile App Development",
    description: "Building native and cross-platform mobile apps.",
    icon: Code,
    iconColor: "bg-indigo-100 text-indigo-600",
  },
  {
    title: "API Integration",
    description: "Connecting different software systems and services.",
    icon: Code,
    iconColor: "bg-pink-100 text-pink-600",
  },
  {
    title: "Branding",
    description: "Creating a strong and consistent brand identity.",
    icon: Palette,
    iconColor: "bg-orange-100 text-orange-600",
  },
  {
    title: "Graphic Design",
    description: "Producing visual content to communicate messages.",
    icon: Palette,
    iconColor: "bg-teal-100 text-teal-600",
  },
];