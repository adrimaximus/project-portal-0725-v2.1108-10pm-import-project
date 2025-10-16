import { icons } from 'lucide-react';

type IconName = keyof typeof icons;

interface IconProps {
  name: IconName;
  className?: string;
  color?: string;
  size?: number;
}

const Icon = ({ name, className, color, size }: IconProps) => {
  const LucideIcon = icons[name];

  if (!LucideIcon) {
    // You can render a fallback icon here if you want
    return null;
  }

  return <LucideIcon className={className} color={color} size={size} />;
};

export default Icon;