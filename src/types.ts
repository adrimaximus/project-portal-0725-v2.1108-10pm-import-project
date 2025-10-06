// General
export interface Tag {
  id: string;
  user_id?: string;
  name: string;
  color: string;
  type?: string;
  isNew?: boolean;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
}

// User related types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  initials: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  status?: 'active' | 'suspended' | 'Pending invite';
  updated_at?: string;
  people_kanban_settings?: any;
}

export type Profile = User;
export type Collaborator = User;
export type AssignedUser = User;

// Enums and constants
export const PROJECT_STATUSES = ['On Track', 'At Risk', 'Off Track', 'On Hold', 'Completed', 'Archived'] as const;
export type ProjectStatus = typeof PROJECT_STATUSES[number];
export const PROJECT_STATUS_OPTIONS = PROJECT_STATUSES.map(s => ({ value: s, label: s }));

export const PAYMENT_STATUSES = ['Paid', 'Unpaid', 'Partially Paid', 'Overdue'] as const;
export type PaymentStatus = typeof PAYMENT_STATUSES[number];
export const PAYMENT_STATUS_OPTIONS = PAYMENT_STATUSES.map(s => ({ value: s, label: s }));

export const TASK_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export type TaskPriority = typeof TASK_PRIORITIES[number];

export const TASK_STATUSES = ['To do', 'In progress', 'Done'] as const;
export type TaskStatus = typeof TASK_STATUSES[number];

export const GOAL_TYPES = ['habit', 'target'] as const;
export type GoalType = typeof GOAL_TYPES[number];

export const GOAL_PERIODS = ['day', 'week', 'month', 'year'] as const;
export type GoalPeriod = typeof GOAL_PERIODS[number];

export const FOLDER_ACCESS_LEVELS = ['private', 'public_view', 'public_edit', 'team'] as const;
export type FolderAccessLevel = typeof FOLDER_ACCESS_LEVELS[number];

// Main interfaces
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  budget?: number;
  start_date?: string;
  due_date?: string;
  payment_status: PaymentStatus;
  created_by: User;
  assignedTo: AssignedUser[];
  services: string[];
  tags: Tag[];
  slug: string;
  progress?: number;
  category?: string;
  payment_due_date?: string;
  origin_event_id?: string;
  venue?: string;
  tasks?: Task[];
  comments?: Comment[];
  briefFiles?: ProjectFile[];
  activities?: Activity[];
  client?: Person;
  company?: Company;
  person_ids?: string[];
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  project_id: string;
  assignees: AssignedUser[];
  created_by: User;
  due_date?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  tags?: Tag[];
  origin_ticket_id?: string;
  attachments?: Attachment[];
  project_slug?: string;
  project_name?: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  icon: string;
  color: string;
  type: GoalType;
  target_quantity?: number;
  target_value?: number;
  frequency?: string;
  target_period?: GoalPeriod;
  unit?: string;
  specific_days?: string[];
  created_at: string;
  updated_at: string;
  slug: string;
  tags: Tag[];
  collaborators: User[];
  completions: GoalCompletion[];
  icon_url?: string;
}

export interface GoalCompletion {
  id: string;
  date: string;
  value: number;
  notes?: string;
  userId: string;
}

export interface Person {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  avatar_url?: string;
  tags?: Tag[];
  projects?: {id: string, name: string, slug: string}[];
  contact?: {
    emails?: string[];
    phones?: string[];
    websites?: string[];
  };
  social_media?: Record<string, string>;
  birthday?: string;
  notes?: string;
  address?: any;
  custom_properties?: Record<string, any>;
  company_id?: string;
  department?: string;
  updated_at?: string;
  kanban_order?: number;
}

export interface Company {
  id: string;
  name: string;
  legal_name?: string;
  address?: string;
  billing_address?: string;
  logo_url?: string;
  custom_properties?: Record<string, any>;
  updated_at?: string;
}

export type PropertyType = 'text' | 'number' | 'date' | 'select' | 'textarea' | 'image' | 'url' | 'email' | 'phone';

export interface ContactProperty {
  id: string;
  name: string;
  label: string;
  type: PropertyType;
  options?: {label: string, value: string}[];
  is_default?: boolean;
}

export type CompanyProperty = ContactProperty;

export interface KbFolder {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  access_level: FolderAccessLevel;
  collaborators?: User[];
  slug: string;
  category?: string;
  updated_at?: string;
}

export interface KbArticle {
  id: string;
  folder_id: string;
  user_id: string;
  title: string;
  content: any; // JSON from editor
  slug: string;
  created_at: string;
  updated_at: string;
  header_image_url?: string;
  tags?: Tag[];
  kb_folders?: { name: string; slug: string };
  creator?: User;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string;
  created_at: string;
  resource_type?: string;
  resource_id?: string;
  data?: { link?: string };
  actor?: User;
  read_at?: string | null;
}

export interface Activity {
  id: string;
  type: string;
  details: { description: string };
  created_at: string;
  user: User;
}

export interface Comment {
  id: string;
  text: string;
  created_at: string;
  author: User;
  is_ticket?: boolean;
  attachment_url?: string;
  attachment_name?: string;
  project_id: string;
  author_id: string;
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

// DB Chat types
export interface DbConversation {
  conversation_id: string;
  is_group: boolean;
  conversation_name: string;
  conversation_avatar: string;
  last_message_content: string;
  last_message_at: string;
  other_user_id?: string;
  participants: Collaborator[];
  created_by: string;
}

export interface DbMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  message_type: 'user' | 'system_notification';
  reply_to_message_id?: string;
  is_deleted?: boolean;
  is_forwarded?: boolean;
  sender_first_name?: string;
  sender_last_name?: string;
  sender_avatar_url?: string;
  sender_email?: string;
  replied_message_content?: string;
  replied_message_sender_name?: string;
  replied_message_is_deleted?: boolean;
}

// Frontend-specific Chat types
export interface Conversation {
  id: string;
  userName: string;
  userAvatar?: string;
  isGroup: boolean;
  members: Collaborator[];
  lastMessage?: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  messages: Message[];
  created_by: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender: User;
  text: string;
  timestamp: string;
  attachment?: Attachment;
  message_type: 'user' | 'system_notification';
  repliedMessage?: {
    content: string;
    senderName: string;
    isDeleted: boolean;
  };
  is_deleted?: boolean;
  is_forwarded?: boolean;
}

export interface Attachment {
  name: string;
  type: string;
  url: string;
  size: number;
}

export interface UserStatData {
  user: User;
  projectCount: number;
  totalValue: number;
}