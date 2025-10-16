export interface User {
  id: string;
  name: string;
  avatar_url: string | null;
  email: string;
  initials: string;
  first_name: string | null;
  last_name: string | null;
}

export interface Person {
  id: string;
  full_name: string;
  contact?: { emails?: string[], phones?: string[] };
  company?: string;
  job_title?: string;
  department?: string;
  social_media?: any;
  birthday?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  avatar_url?: string;
  user_id?: string;
  address?: any;
  company_id?: string;
}

export interface Company {
    id: string;
    name: string;
    logo_url?: string;
}