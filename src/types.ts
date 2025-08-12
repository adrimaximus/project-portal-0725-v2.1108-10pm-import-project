import { Session as SupabaseSession, User as SupabaseUser } from '@supabase/supabase-js';

// --- User & Profile Types ---
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  initials: string;
  first_name?: string | null;
  last_name?: string | null;
  role?: 'owner' | 'member' | string;
}
export type UserProfile = User;


// --- Project Types ---
export type ProjectStatus = 'Requested' | 'In Progress' | 'In Review' | 'On Hold' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Proposed' | 'Pending' | 'Paid' | 'Overdue' | 'Cancelled';

export interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
  originTicketId?: string;
  assignedTo: UserProfile[];
}

export interface ProjectComment {
  id: string;
  text: string;
  timestamp: string;
  isTicket: boolean;
  attachment_url?: string;
  attachment_name?: string;
  author: UserProfile;
}

export interface BriefFile {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    storage_path: string;
    created_at: string;
}

export interface Activity {
  id: string;
  user: UserProfile;
  type: string;
  timestamp: string; // ISO string
  details?: {
    description: string;
  };
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  status: string;
  progress: number;
  budget: number;
  startDate: string;
  dueDate: string;
  paymentStatus: string;
  paymentDueDate?: string;
  createdBy: UserProfile;
  assignedTo: UserProfile[];
  tasks: ProjectTask[];
  comments: ProjectComment[];
  services?: string[];
  briefFiles?: BriefFile[];
  activities?: Activity[];
}


// --- Chat Types ---
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


// --- Google Calendar Types ---
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

// --- Goals Types ---
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


// --- Supabase Types ---
export type { SupabaseSession, SupabaseUser };