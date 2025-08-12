import { Briefcase, Code, Megaphone, Palette, Rocket, ShieldCheck, type LucideIcon } from "lucide-react";

export const iconMap: { [key: string]: LucideIcon } = {
  Briefcase,
  Code,
  Megaphone,
  Palette,
  Rocket,
  ShieldCheck,
};

export const getIcon = (name: string | null | undefined): LucideIcon => {
  if (name && iconMap[name]) {
    return iconMap[name];
  }
  return Rocket; // Return Rocket as a default fallback
};