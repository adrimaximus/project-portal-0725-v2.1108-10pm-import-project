export interface Person {
  id: string;
  full_name: string;
  email?: string;
  contact?: { emails?: string[]; phones?: string[] };
  company?: string;
  job_title?: string;
  department?: string;
  social_media?: { linkedin?: string; twitter?: string; instagram?: string };
  birthday?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  projects?: { id: string; name: string, slug: string }[];
  tags?: { id: string; name: string; color: string }[];
  address?: { formatted_address?: string; } | null;
  avatar_url?: string;
  user_id?: string;
  custom_properties?: Record<string, any>;
}