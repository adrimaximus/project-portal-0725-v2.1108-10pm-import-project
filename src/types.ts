import { Session, User as SupabaseUser } from '@supabase/supabase-js';

export type SupabaseSession = Session;
export { SupabaseUser };

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
  initials: string;
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  initials: string;
  online?: boolean;
}

export interface MessageSender {
    id: string;
    name: string;
    avatar: string | null;
    initials: string;
}

export interface Attachment {
  file: File;
  previewUrl: string;
}

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: MessageSender;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  groupName?: string | null;
  userName?: string | null;
  userAvatar?: string | null;
  lastMessage?: string | null;
  lastMessageTimestamp?: string;
  participants: Collaborator[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export type GoalType = 'quantity' | 'value';
export type GoalPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type DayOfWeek = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

export interface GoalCompletion {
  id: string;
  date: string; // ISO string
  value: number;
  notes?: string;
  userId: string;
}

export interface Goal {
  id: string;
  slug: string;
  title: string;
  description?: string;
  icon: string;
  icon_url?: string;
  color: string;
  type: GoalType;
  target_quantity?: number;
  target_value?: number;
  frequency?: 'daily' | 'specific_days';
  target_period?: GoalPeriod;
  unit?: string;
  specific_days?: DayOfWeek[];
  collaborators: User[];
  completions: GoalCompletion[];
  tags: Tag[];
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  extendedProperties?: {
    private?: {
      projectId?: string;
    };
  };
}