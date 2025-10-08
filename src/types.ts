export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type User = {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  updated_at: string | null
  email: string | null
  role: string | null
  status: string | null
  sidebar_order: Json | null
  notification_preferences: Json | null
  people_kanban_settings: Json | null
  theme: string | null
};

export type Collaborator = {
  id: string;
  name: string;
  initials: string;
  avatar_url?: string | null;
};

// This line is important if you have auto-generated Supabase types
export * from './db-types';