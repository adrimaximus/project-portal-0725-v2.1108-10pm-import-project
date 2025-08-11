import { Session, User as SupabaseUser } from '@supabase/supabase-js';

export type SupabaseSession = Session;
export type { SupabaseUser };

// This will be the main User type used across the app
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
  name: string;
  url: string;
  type: 'image' | 'file';
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

// Project related types
export type ProjectStatus = 'Requested' | 'In Progress' | 'Completed' | 'Billed' | 'On Hold' | 'Cancelled' | 'Done' | 'Not Started' | 'On Track' | 'At Risk' | 'Off Track';
export type PaymentStatus = 'Proposed' | 'Approved' | 'PO Created' | 'On Process' | 'Pending' | 'Paid' | 'Cancelled' | 'Overdue' | 'Unpaid';

export interface AssignedUser extends User {
  role: 'owner' | 'member';
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  assignedTo: User[];
  originTicketId?: string;
}

export interface Comment {
  id: string;
  text: string;
  timestamp: string; // This is created_at
  is_ticket: boolean;
  author: User;
  attachment?: Attachment;
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
    type: string;
    user: { name: string };
    details: { description: string };
    timestamp: string;
}

export interface Project {
  id: string;
  name: string;
  category: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  budget: number | null;
  startDate: string;
  dueDate: string;
  paymentStatus: PaymentStatus;
  paymentDueDate?: string | null;
  createdBy: User | null;
  assignedTo: AssignedUser[];
  tasks: Task[];
  comments: Comment[];
  activities: Activity[];
  briefFiles: ProjectFile[];
  services: string[];
}