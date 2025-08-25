export * from './supabase';
export * from './user';
export * from './project';
export * from './goal';
export * from './chat';
export * from './gcal';
export * from './notifications';
export * from './kb';
export * from './people';

export interface ContactProperty {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'url' | 'date' | 'textarea' | 'number';
  is_default: boolean;
}