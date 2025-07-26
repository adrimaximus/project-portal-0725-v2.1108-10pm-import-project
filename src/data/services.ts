import { Code, Smartphone, Palette, Gem, Megaphone, Search, PenTool, Cloud, ShoppingCart, Wrench } from "lucide-react";
import { ElementType } from "react";

export interface Service {
  title: string;
  description: string;
  icon: ElementType;
  iconColor: string;
}

export const services: Service[] = [
  {
    title: "Web Development",
    description: "Crafting modern, responsive websites and web applications.",
    icon: Code,
    iconColor: "text-blue-500",
  },
  {
    title: "Mobile App Development",
    description: "Building intuitive and high-performing apps for iOS and Android.",
    icon: Smartphone,
    iconColor: "text-green-500",
  },
  {
    title: "UI/UX Design",
    description: "Designing user-centric interfaces that are both beautiful and easy to use.",
    icon: Palette,
    iconColor: "text-purple-500",
  },
  {
    title: "Branding & Identity",
    description: "Creating strong brand identities that resonate with your audience.",
    icon: Gem,
    iconColor: "text-pink-500",
  },
  {
    title: "Digital Marketing",
    description: "Driving growth through strategic online marketing campaigns.",
    icon: Megaphone,
    iconColor: "text-yellow-500",
  },
  {
    title: "Search Engine Optimization (SEO)",
    description: "Improving your visibility on search engines to attract more traffic.",
    icon: Search,
    iconColor: "text-red-500",
  },
  {
    title: "Content Creation",
    description: "Producing engaging content that tells your brand's story.",
    icon: PenTool,
    iconColor: "text-indigo-500",
  },
  {
    title: "Cloud Solutions",
    description: "Leveraging cloud infrastructure for scalability and efficiency.",
    icon: Cloud,
    iconColor: "text-sky-500",
  },
  {
    title: "E-commerce Development",
    description: "Building robust online stores to sell your products and services.",
    icon: ShoppingCart,
    iconColor: "text-orange-500",
  },
  {
    title: "Maintenance & Support",
    description: "Providing ongoing support to keep your applications running smoothly.",
    icon: Wrench,
    iconColor: "text-gray-500",
  },
];