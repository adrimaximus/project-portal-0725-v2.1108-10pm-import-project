import { Briefcase, Code, Megaphone, Palette, Rocket, ShieldCheck, type LucideIcon } from "lucide-react";

export const iconMap: { [key: string]: LucideIcon } = {
  Briefcase,
  Code,
  Megaphone,
  Palette,
  Rocket,
  ShieldCheck,
};

export const getIcon = (name: string): LucideIcon => {
  return iconMap[name] || Rocket; // Return Rocket as a default fallback
};