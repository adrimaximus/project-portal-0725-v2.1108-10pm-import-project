import { Session as SupabaseSession, User as SupabaseUser } from '@supabase/supabase-js';

// Re-export Supabase types
export type { SupabaseSession, SupabaseUser };

// User and Project Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  initials: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
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

export interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
  assignedTo: User[];
}

export interface ProjectComment {
  id: string;
  isTicket: boolean;
  text?: string;
  author_id?: string;
  created_at?: string;
  author?: User;
}

export interface ProjectMember extends User {
  role: 'owner' | 'member';
}

export interface Project {
  id: string;
  name: string;
  category: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  start_date: string;
  due_date: string;
  payment_status: string;
  created_by: User;
  assignedTo: ProjectMember[];
  tasks: ProjectTask[];
  comments: ProjectComment[];
}

// Chat Types
export interface Collaborator extends User {
  // any additional collaborator-specific fields
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  sender?: Collaborator;
}

export interface Conversation {
  conversation_id: string;
  is_group: boolean;
  group_name?: string;
  last_message_content?: string;
  last_message_at?: string;
  other_user_id?: string;
  other_user_name?: string;
  other_user_avatar?: string;
  participants: Collaborator[];
}

// Goal Types
export type GoalType = 'quantity' | 'value' | 'binary';
export type GoalPeriod = 'day' | 'week' | 'month' | 'year';

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
  frequency?: string;
  target_period?: GoalPeriod;
  unit?: string;
  specific_days?: string[];
  collaborators: User[];
  completions: GoalCompletion[];
  tags: Tag[];
  user_id?: string;
}

// Other types
export interface GoogleCalendarEvent {
  summary: string;
  start: {
    dateTime: string;
  };
  end: {
    dateTime: string;
  };
}