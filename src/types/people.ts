export interface Person {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  contact?: { emails?: string[]; phones?: string[] };
  company?: string;
  company_logo_url?: string;
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
  kanban_order?: number;
}

export interface Company {
  id: string;
  name: string;
  legal_name: string | null;
  address: string | null;
  billing_address: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

export interface ContactProperty {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'url' | 'date' | 'textarea' | 'number' | 'image';
  is_default: boolean;
  created_at?: string;
}