import type { LucideIcon } from "lucide-react";
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

export interface Service {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
}

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

export interface AuthContextType {
  session: Session | null;
  user: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}