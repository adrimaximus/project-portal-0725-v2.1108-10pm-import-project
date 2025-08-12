import { Session as SupabaseSession, User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
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

export interface Conversation {
  id: string;
  userName: string;
  userAvatar?: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  messages: Message[];
  isGroup?: boolean;
  members?: Collaborator[];
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

// Types for Goals Feature
export type GoalType = 'quantity' | 'value' | 'frequency';
export type GoalPeriod = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

export interface Tag {
    id: string;
    name: string;
    color: string;
}

export interface GoalCompletion {
  id: string;
  date: string; // ISO 8601 date string
  value: number;
  notes?: string;
  userId: string;
}

export interface Goal {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  iconUrl?: string;
  color: string;
  type: GoalType;
  targetQuantity?: number;
  targetValue?: number;
  frequency: 'Daily' | 'Weekly';
  targetPeriod?: GoalPeriod;
  unit?: string;
  collaborators: User[];
  completions: GoalCompletion[];
  tags: Tag[];
  specificDays: string[];
}


export type { SupabaseSession, SupabaseUser };