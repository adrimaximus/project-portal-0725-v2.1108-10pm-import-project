import {
  Palette,
  Code,
  TrendingUp,
  FileText,
  Smartphone,
  PenTool,
  Award,
  ShoppingCart,
  Cloud,
  Wrench,
} from 'lucide-react';
import { ElementType } from 'react';

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: ElementType;
  iconColor: string;
}

export const services: Service[] = [
  { 
    id: 'web-design', 
    title: 'Web Design', 
    description: 'Creating visually appealing and user-friendly websites.',
    icon: Palette,
    iconColor: 'text-blue-500',
  },
  { 
    id: 'development', 
    title: 'Development', 
    description: 'Building robust and scalable web applications.',
    icon: Code,
    iconColor: 'text-green-500',
  },
  { 
    id: 'seo', 
    title: 'SEO', 
    description: 'Improving search engine rankings to increase organic traffic.',
    icon: TrendingUp,
    iconColor: 'text-red-500',
  },
  { 
    id: 'content-marketing', 
    title: 'Content Marketing', 
    description: 'Creating and distributing valuable content to attract users.',
    icon: FileText,
    iconColor: 'text-yellow-600',
  },
  { 
    id: 'mobile-app', 
    title: 'Mobile App Development', 
    description: 'Developing native or cross-platform mobile apps.',
    icon: Smartphone,
    iconColor: 'text-purple-500',
  },
  { 
    id: 'ui-ux', 
    title: 'UI/UX Design', 
    description: 'Designing intuitive and engaging user interfaces.',
    icon: PenTool,
    iconColor: 'text-pink-500',
  },
  { 
    id: 'branding', 
    title: 'Branding', 
    description: 'Developing a strong and consistent brand identity.',
    icon: Award,
    iconColor: 'text-indigo-500',
  },
  { 
    id: 'e-commerce', 
    title: 'E-commerce', 
    description: 'Building online stores with seamless shopping experiences.',
    icon: ShoppingCart,
    iconColor: 'text-teal-500',
  },
  { 
    id: 'cloud-services', 
    title: 'Cloud Services', 
    description: 'Leveraging cloud platforms for scalability and reliability.',
    icon: Cloud,
    iconColor: 'text-sky-500',
  },
  { 
    id: 'maintenance', 
    title: 'Maintenance', 
    description: 'Providing ongoing support and updates for your applications.',
    icon: Wrench,
    iconColor: 'text-gray-500',
  },
];

export const allServices = services.map(s => s.title);