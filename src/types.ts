import { Session as SupabaseSession, User as SupabaseUser } from '@supabase/supabase-js';

// Re-export Supabase types
export type { SupabaseSession, SupabaseUser };

// User and Project Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
  first_name?: string;
  last_name?: string;
  role?: string; // Added for dummy data compatibility
}

export type ProjectStatus = 
  | "Requested"
  | "In Progress"
  | "On Hold"
  | "Completed"
  | "Cancelled"
  | "On Track"
  | "At Risk"
  | "Off Track"
  | "Done"
  | "Billed"
  | "Proposed"
  | "Approved"
  | "PO Created"
  | "On Process"
  | "Pending"
  | "Paid"
  | "Overdue";

export type PaymentStatus = 'Proposed' | 'Approved' | 'PO Created' | 'On Process' | 'Pending' | 'Paid' | 'Cancelled' | 'Overdue';

export interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
  assignedTo: User[];
  originTicketId?: string;
}

export interface ProjectComment {
  id: string;
  isTicket: boolean;
  text?: string;
  author_id?: string;
  created_at?: string;
  author?: User;
  timestamp: string;
  attachment?: { name: string; url: string };
}

export interface ProjectMember extends User {
  role: 'owner' | 'member';
}

export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string | null;
  url: string;
  storagePath: string;
  uploadedAt: string;
}

export interface Activity {
  id: string;
  user: User;
  type: string;
  details: {
    description: string;
    [key: string]: any;
  };
  timestamp: string;
}

export interface Project {
  id: string;
  name: string;
  category: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  startDate: string;
  dueDate: string;
  paymentStatus: PaymentStatus;
  paymentDueDate?: string;
  createdBy: User;
  assignedTo: ProjectMember[];
  tasks: ProjectTask[];
  comments: ProjectComment[];
  activities?: Activity[];
  briefFiles?: ProjectFile[];
  services?: string[];
}

// Chat Types
export interface Collaborator extends User {
  online?: boolean;
}

export interface Attachment {
  id?: string; // Optional for new attachments
  name: string;
  url: string;
  type: 'image' | 'file' | string;
  size?: number; // Optional for new attachments
}

export interface Message {
  id: string;
  text: string;
  timestamp: string;
  sender: Collaborator;
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
  members?: Collaborator[];
}

// Goal Types
export type GoalType = 'frequency' | 'quantity' | 'value';
export type GoalPeriod = 'Weekly' | 'Monthly';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface GoalCompletion {
  id: string;
  date: string;
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
  frequency?: 'Daily' | 'Weekly';
  target_period?: GoalPeriod;
  unit?: string;
  specific_days: string[];
  collaborators: User[];
  completions: GoalCompletion[];
  tags: Tag[];
  user_id?: string;
}

// Other types
export interface GoogleCalendarEvent {
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}