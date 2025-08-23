import { Tag } from './goal';

export interface Person {
  id: string;
  full_name: string;
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
  tags?: Tag[];
  address?: { formatted_address?: string; } | null;
  avatar_url?: string;
}