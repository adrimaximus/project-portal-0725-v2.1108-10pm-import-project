import { LucideIcon } from "lucide-react";

export interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  online?: boolean;
}

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}