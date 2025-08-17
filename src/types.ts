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
  role?: 'owner' | 'member' | 'admin' | string;
  status?: 'active' | 'suspended' | 'Pending invite' | string;
  lastActive?: string;
  updated_at?: string;
  sidebar_order?: string[];
}
export type UserProfile = User;
export interface AssignedUser extends UserProfile {
  role?: string;
}


// --- Project Types ---
export const PROJECT_STATUSES = ['Requested', 'In Progress', 'In Review', 'On Hold', 'Completed', 'Cancelled'] as const;
export type ProjectStatus = typeof PROJECT_STATUSES[number];

export const PROJECT_STATUS_OPTIONS = [
  { value: 'Requested', label: 'Requested' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'In Review', label: 'In Review' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
] as const;

export const PAYMENT_STATUSES = ['Proposed', 'Pending', 'Paid', 'Overdue', 'Cancelled'] as const;
export type PaymentStatus = typeof PAYMENT_STATUSES[number];

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'Proposed', label: 'Proposed' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'Cancelled', label: 'Cancelled' },
] as const;

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  originTicketId?: string;
  assignedTo: UserProfile[];
}

export interface Comment {
  id: string;
  text: string;
  timestamp: string;
  isTicket: boolean;
  attachment_url?: string;
  attachment_name?: string;
  author: UserProfile;
}

export interface ProjectFile {
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
  status: ProjectStatus | string;
  progress: number;
  budget: number;
  startDate: string;
  dueDate: string;
  paymentStatus: PaymentStatus | string;
  paymentDueDate?: string;
  createdBy: UserProfile;
  assignedTo: AssignedUser[];
  tasks: Task[];
  comments: Comment[];
  services?: string[];
  briefFiles?: ProjectFile[];
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
  icon_url?: string;
  color: string;
  type: GoalType;
  target_quantity?: number;
  target_value?: number;
  frequency: 'Daily' | 'Weekly';
  target_period?: GoalPeriod;
  unit?: string;
  collaborators: User[];
  completions: GoalCompletion[];
  tags: Tag[];
  specific_days: string[];
}


// --- Supabase Types ---
export type { SupabaseSession, SupabaseUser };