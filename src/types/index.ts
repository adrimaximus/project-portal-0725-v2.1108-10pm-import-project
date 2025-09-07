export * from './supabase';
export * from './user';
export * from './project';
export * from './goal';
export * from './chat';
export * from './notifications';
export * from './kb';
export * from './people';

export interface ContactProperty {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'url' | 'date' | 'textarea' | 'number' | 'image';
  is_default: boolean;
}

export interface Company {
  id: string;
  name: string;
  legal_name?: string;
  address?: string;
  billing_address?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}