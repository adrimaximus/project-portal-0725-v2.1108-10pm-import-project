import { icons, LucideProps, HelpCircle } from 'lucide-react';
import { ForwardRefExoticComponent, RefAttributes } from 'react';

export type IconName = keyof typeof icons;

export const getIcon = (name: string | undefined): ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>> => {
  if (!name) return HelpCircle;
  const iconName = name as IconName;
  const IconComponent = icons[iconName];
  
  if (!IconComponent) {
    return HelpCircle; // Return a default icon if not found
  }
  
  return IconComponent;
};