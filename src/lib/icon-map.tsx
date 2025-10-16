import {
  LucideIcon,
  Briefcase,
  Lightbulb,
  CalendarCheck,
  Megaphone,
  Users,
  MapPin,
  Paintbrush,
  PenTool,
  Camera,
  Clapperboard,
  Mic,
  Palette,
  HelpCircle,
} from "lucide-react";

export const iconMap: { [key: string]: LucideIcon } = {
  Briefcase,
  Lightbulb,
  CalendarCheck,
  Megaphone,
  Users,
  MapPin,
  Paintbrush,
  PenTool,
  Camera,
  Clapperboard,
  Mic,
  Palette,
};

export const getIcon = (name: string): LucideIcon => {
  return iconMap[name] || HelpCircle;
};