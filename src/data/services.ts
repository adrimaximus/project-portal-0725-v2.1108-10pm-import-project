import { Code, Smartphone, Palette, Gem, LineChart, Users, PenSquare, Briefcase } from 'lucide-react';
import React from 'react';

export interface Service {
  id: string;
  title: string;
  icon: React.ElementType;
  iconColor: string;
}

export const allServices: Service[] = [
  { id: 'web-dev', title: 'Web Development', icon: Code, iconColor: 'text-blue-500' },
  { id: 'app-dev', title: 'Mobile App Development', icon: Smartphone, iconColor: 'text-green-500' },
  { id: 'ui-ux', title: 'UI/UX Design', icon: Palette, iconColor: 'text-purple-500' },
  { id: 'branding', title: 'Branding & Identity', icon: Gem, iconColor: 'text-pink-500' },
  { id: 'seo', title: 'SEO & Digital Marketing', icon: LineChart, iconColor: 'text-orange-500' },
  { id: 'social-media', title: 'Social Media Management', icon: Users, iconColor: 'text-cyan-500' },
  { id: 'content-creation', title: 'Content Creation', icon: PenSquare, iconColor: 'text-yellow-500' },
  { id: 'consulting', title: 'IT Consulting', icon: Briefcase, iconColor: 'text-gray-500' },
];