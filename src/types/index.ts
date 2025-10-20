export interface ContactProperty {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'email' | 'phone' | 'url' | 'select' | 'multi-select';
  is_default: boolean;
  options?: string[];
}

export interface Person {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  job_title?: string | null;
  created_at: string;
}