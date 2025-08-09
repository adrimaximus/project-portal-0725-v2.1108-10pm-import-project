import { Session as SupabaseSession, User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  email?: string;
  name: string;
  avatar?: string;
  initials: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  initials: string;
  online: boolean;
  avatar?: string;
}

export interface Attachment {
  name:string;
  type: 'image' | 'file';
  url: string;
}

export interface Message {
  id: string;
  sender: User | Collaborator;
  text: string;
  timestamp: string;
  attachment?: Attachment | null;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  status: string;
  start: {
    dateTime: string;
    date?: string;
  };
  end: {
    dateTime: string;
    date?: string;
  };
}

export interface GoogleCalendarListEntry {
  id: string;
  summary: string;
  backgroundColor: string;
  foregroundColor: string;
  selected?: boolean;
}

export type { SupabaseSession, SupabaseUser };