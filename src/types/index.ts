import { Session, User as SupabaseUser } from '@supabase/supabase-js';

// Base User/Profile type
export interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email?: string;
  role?: string;
  status?: string;
  // For convenience after mapping
  name?: string;
  initials?: string;
  // For AuthContext
  sidebar_order?: any; // JSONB
  permissions?: string[];
  updated_at?: string;
}

export type Collaborator = Pick<User, 'id' | 'first_name' | 'last_name' | 'avatar_url' | 'email'> & {
  name?: string;
  initials?: string;
};

export type SupabaseSession = Session;
export type { SupabaseUser };

// Tag
export interface Tag {
  id: string;
  user_id: string | null;
  name: string;
  color: string;
  isNew?: boolean; // For client-side creation
}

// Project related types
export type ProjectStatus = 'On Track' | 'At Risk' | 'Off Track' | 'On Hold' | 'Completed' | 'Archived' | 'Pending';
export type PaymentStatus = 'Paid' | 'Unpaid' | 'Partially Paid' | 'Overdue';

export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'On Track', label: 'On Track' },
  { value: 'At Risk', label: 'At Risk' },
  { value: 'Off Track', label: 'Off Track' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Archived', label: 'Archived' },
  { value: 'Pending', label: 'Pending' },
];

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'Paid', label: 'Paid' },
  { value: 'Unpaid', label: 'Unpaid' },
  { value: 'Partially Paid', label: 'Partially Paid' },
  { value: 'Overdue', label: 'Overdue' },
];

export interface AssignedUser extends User {
  role: 'owner' | 'admin' | 'editor' | 'member' | 'viewer';
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

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  due_date?: string;
  assignedTo?: AssignedUser[];
  createdBy?: User;
  description?: string;
  priority?: 'low' | 'normal' | 'high';
  tags?: Tag[];
  origin_ticket_id?: string;
}

export interface Comment {
  id: string;
  text: string;
  timestamp: string;
  author: User;
  isTicket?: boolean;
  attachment_url?: string;
  attachment_name?: string;
}

export interface Activity {
  id: string;
  type: string;
  details: { description: string };
  timestamp: string;
  user: User;
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  category?: string;
  description?: string;
  status: ProjectStatus;
  progress: number;
  budget?: number;
  start_date?: string;
  due_date?: string;
  payment_status: PaymentStatus;
  payment_due_date?: string;
  created_by: User;
  assignedTo: AssignedUser[];
  tasks: Task[];
  comments: Comment[];
  services: string[];
  briefFiles: ProjectFile[];
  activities: Activity[];
  tags: Tag[];
  venue?: string | null;
}

// Person / Contact types
export interface Person {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  job_title?: string | null;
  avatar_url?: string | null;
  tags?: Tag[];
  contact?: {
    emails?: string[];
    phones?: string[];
  };
  department?: string | null;
  social_media?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  } | null;
  birthday?: string | null;
  notes?: string | null;
  projects?: { id: string; name: string; slug: string }[];
  address?: {
    formatted_address?: string;
  } | null;
  custom_properties?: Record<string, any> | null;
  updated_at?: string;
  created_at?: string;
}

export interface ContactProperty {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'url' | 'email' | 'phone' | 'textarea' | 'image';
  is_default: boolean;
}

export interface Company {
  id: string;
  name: string;
  legal_name?: string;
  address?: string;
  billing_address?: string;
  logo_url?: string;
}

// Chat related types
export interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  content: string | null;
  created_at: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  message_type: 'user' | 'system_notification' | 'ai';
  reply_to_message_id?: string | null;
  is_deleted?: boolean;
  sender: User | null;
  attachment?: Attachment;
  replied_message_content?: string | null;
  replied_message_sender_name?: string | null;
  replied_message_is_deleted?: boolean;
}

export interface Conversation {
  conversation_id: string;
  is_group: boolean;
  conversation_name: string;
  conversation_avatar: string | null;
  last_message_content: string | null;
  last_message_at: string;
  other_user_id?: string;
  participants: Collaborator[];
  created_by: string;
  messages?: Message[];
  unreadCount?: number;
}

// Goal related types
export type GoalType = 'habit' | 'target' | 'milestone';
export type GoalPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface GoalCompletion {
  id: string;
  date: string;
  value: number;
  notes?: string;
  userId: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  icon: string;
  icon_url?: string | null;
  color: string;
  type: GoalType;
  target_quantity?: number;
  target_value?: number;
  frequency?: GoalPeriod;
  target_period?: GoalPeriod;
  unit?: string;
  specific_days?: string[];
  slug: string;
  tags: Tag[];
  collaborators: User[];
  completions: GoalCompletion[];
}

// Knowledge Base related types
export type FolderAccessLevel = 'private' | 'public_view' | 'public_edit';

export interface KbFolder {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  slug: string;
  icon: string;
  color: string;
  access_level: FolderAccessLevel;
  collaborators?: User[];
  article_count?: number;
  category?: string | null;
  updated_at?: string;
}

export interface KbArticle {
  id: string;
  folder_id: string;
  user_id: string;
  title: string;
  content: any; // JSONB
  slug: string;
  created_at: string;
  updated_at: string;
  header_image_url?: string;
  tags: Tag[];
  folder?: Pick<KbFolder, 'name' | 'slug'>;
  creator?: User;
}

// Notification type
export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  created_at: string;
  resource_type?: string;
  resource_id?: string;
  data?: { link?: string };
  actor: User;
  read_at: string | null;
}