import { Session as SupabaseSession, User as SupabaseUser } from '@supabase/supabase-js';
export type { SupabaseSession, SupabaseUser };

export interface User {
  id: string;
  email?: string;
  name: string;
  avatar?: string;
  initials: string;
  first_name?: string | null;
  last_name?: string | null;
  role?: string;
  status?: string;
  sidebar_order?: string[];
  updated_at?: string;
}

export type Collaborator = User & { online?: boolean };
export type AssignedUser = User;

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  assignedTo: User[];
  originTicketId?: string;
}

export interface Comment {
  id: string;
  author: User;
  timestamp: string;
  text: string;
  isTicket: boolean;
  attachment_url?: string;
  attachment_name?: string;
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
  type: string;
  user: User;
  details: { description: string };
  timestamp: string;
}

export type ProjectStatus = 'Requested' | 'In Progress' | 'In Review' | 'On Hold' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Unpaid' | 'Paid' | 'Pending' | 'In Process' | 'Overdue' | 'Proposed' | 'Cancelled';

export interface Project {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  start_date: string;
  due_date: string;
  payment_status: PaymentStatus;
  payment_due_date?: string;
  created_by: User;
  assignedTo: AssignedUser[];
  tasks: Task[];
  comments: Comment[];
  services: string[];
  briefFiles: ProjectFile[];
  activities?: Activity[];
}

export type GoalType = 'frequency' | 'quantity' | 'value';
export type GoalPeriod = 'Weekly' | 'Monthly';

export interface GoalCompletion {
  id: string;
  date: string;
  value: number;
  notes?: string;
  userId: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id?: string;
  isNew?: boolean;
}

export interface Goal {
  id: string;
  user_id: string;
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
  specific_days?: string[];
  created_at: string;
  updated_at: string;
  slug: string;
  tags: Tag[];
  collaborators: Collaborator[];
  completions: GoalCompletion[];
}

export interface Attachment {
  name: string;
  url: string;
  type: 'image' | 'file';
}

export interface Message {
  id: string;
  text: string;
  timestamp: string;
  sender: User;
  attachment?: Attachment;
}

export interface Conversation {
  id: string;
  userName: string;
  userAvatar?: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  messages: Message[];
  isGroup: boolean;
  members: Collaborator[];
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  htmlLink: string;
  status: string;
}

export const PROJECT_STATUS_OPTIONS = [
  { value: 'Requested', label: 'Requested' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'In Review', label: 'In Review' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'Unpaid', label: 'Unpaid' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Pending', label: 'Pending' },
  { value: 'In Process', label: 'In Process' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'Proposed', label: 'Proposed' },
  { value: 'Cancelled', label: 'Cancelled' },
];