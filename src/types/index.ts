// Enums and constants
export const PROJECT_STATUS_OPTIONS = [
  { value: 'On Track', label: 'On Track' },
  { value: 'At Risk', label: 'At Risk' },
  { value: 'Off Track', label: 'Off Track' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Completed', label: 'Completed' },
] as const;
export type ProjectStatus = typeof PROJECT_STATUS_OPTIONS[number]['value'];

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'Paid', label: 'Paid' },
  { value: 'Unpaid', label: 'Unpaid' },
  { value: 'Partially Paid', label: 'Partially Paid' },
  { value: 'Overdue', label: 'Overdue' },
] as const;
export type PaymentStatus = typeof PAYMENT_STATUS_OPTIONS[number]['value'];

export const TASK_PRIORITY_OPTIONS = ['low', 'normal', 'high'] as const;
export type TaskPriority = typeof TASK_PRIORITY_OPTIONS[number];

export const TASK_STATUS_OPTIONS = ['To do', 'In progress', 'Done'] as const;
export type TaskStatus = typeof TASK_STATUS_OPTIONS[number];

export type FolderAccessLevel = 'private' | 'public_view' | 'public_edit';

// Core types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  initials: string;
  role?: string;
  status?: string;
  updated_at?: string;
  people_kanban_settings?: any;
  first_name?: string | null;
  last_name?: string | null;
}

export type AssignedUser = User;
export type Collaborator = User;

export interface Tag {
  id: string;
  name: string;
  color: string;
  isNew?: boolean;
  user_id?: string;
}

// Project related types
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  due_date: string | null;
  priority: TaskPriority;
  project_id: string;
  project_name: string;
  project_slug: string;
  project_status: string;
  assignees: User[];
  created_by: User;
  created_at: string;
  updated_at: string;
  status: TaskStatus;
  tags: Tag[];
  origin_ticket_id: string | null;
  attachment_url?: string;
  attachment_name?: string;
  attachments: any[];
}

export interface Comment {
  id: string;
  text: string;
  timestamp: string;
  isTicket: boolean;
  attachment_url?: string;
  attachment_name?: string;
  author: User;
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
  details: { description: string };
  timestamp: string;
  user: User;
}

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
  payment_due_date: string;
  origin_event_id: string;
  venue: string;
  created_by: User;
  assignedTo: User[];
  services: string[];
  tags: Tag[];
  tasks?: Task[];
  comments?: Comment[];
  briefFiles?: ProjectFile[];
  activities?: Activity[];
  kanban_order: number;
  payment_kanban_order: number;
}

// Chat related types
export interface Attachment {
  name: string;
  url: string;
  type: string;
  file?: File;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  created_at: string;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  message_type: 'user' | 'system_notification';
  reply_to_message_id: string | null;
  is_deleted: boolean;
  is_forwarded: boolean;
  sender: User;
  reply_to?: Message;
  // Frontend-mapped properties
  text: string | null;
  timestamp: string;
  attachment?: Attachment;
  repliedMessage?: {
    content: string | null;
    senderName: string;
    isDeleted: boolean;
  };
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  userName: string;
  userAvatar: string | null;
  lastMessage: string | null;
  lastMessageTimestamp: string;
  unreadCount: number;
  members: User[];
  created_by?: string;
  messages: Message[];
}

// Goal related types
export const GOAL_TYPES = ['habit', 'target', 'limit'] as const;
export type GoalType = typeof GOAL_TYPES[number];

export const GOAL_PERIODS = ['day', 'week', 'month', 'year'] as const;
export type GoalPeriod = typeof GOAL_PERIODS[number];

export interface GoalCompletion {
  id: string;
  date: string;
  value: number;
  notes: string | null;
  userId: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  icon: string;
  icon_url: string | null;
  color: string;
  type: GoalType;
  target_quantity: number | null;
  target_value: number | null;
  frequency: string | null;
  target_period: GoalPeriod | null;
  unit: string | null;
  specific_days: string[] | null;
  created_at: string;
  updated_at: string;
  slug: string;
  tags: Tag[];
  collaborators: User[];
  completions: GoalCompletion[];
}

// People/CRM related types
export interface Person {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  country: string | null;
  company: string | null;
  job_title: string | null;
  department: string | null;
  social_media: any;
  birthday: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  projects: { id: string; name: string; slug: string }[];
  tags: Tag[];
  avatar_url: string | null;
  user_id: string | null;
  address: any;
  contact: { emails: string[], phones: string[] };
  custom_properties?: any;
  kanban_order?: number;
}

export interface Company {
  id: string;
  name: string;
  legal_name?: string;
  address?: string;
  billing_address?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface ContactProperty {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'email' | 'phone' | 'textarea' | 'image' | 'url';
  is_default: boolean;
  created_at: string;
}

// Knowledge Base related types
export interface KbArticle {
  id: string;
  title: string;
  slug: string;
  content: any; // JSONB
  folder_id: string;
  updated_at: string;
  header_image_url: string | null;
  kb_folders: { name: string; slug: string };
  tags: Tag[];
  creator: User;
}

export interface KbFolder {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  slug: string;
  icon: string | null;
  color: string | null;
  category: string | null;
  access_level: FolderAccessLevel;
  last_modified_by: string | null;
  collaborators?: User[];
  article_count?: number;
}

// Notification type
export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  created_at: string;
  resource_type: string | null;
  resource_id: string | null;
  data: { link?: string };
  actor: User | null;
  read_at: string | null;
}