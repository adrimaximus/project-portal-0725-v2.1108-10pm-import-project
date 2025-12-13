// This file contains various type definitions used throughout the application.

// General
export type Reaction = {
  id: string;
  emoji: string;
  user_id: string;
  user_name: string;
};

export type User = {
  id: string;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  initials: string;
  role?: string;
  status?: string;
  phone?: string | null;
  updated_at?: string;
  permissions?: string[];
  people_kanban_settings?: any;
  theme?: string;
};

export type Collaborator = User;
export type AssignedUser = User & { role: 'owner' | 'admin' | 'member' | 'editor' };
export type Owner = Pick<User, 'id' | 'name' | 'avatar_url' | 'initials' | 'email'>;

// Projects
export type ProjectStatus = 'On Track' | 'At Risk' | 'Off Track' | 'On Hold' | 'Completed' | 'Cancelled' | 'Bid Lost' | 'In Development' | 'Proposed';
export const PROJECT_STATUS_OPTIONS = [
  { value: 'Proposed', label: 'Proposed' },
  { value: 'In Development', label: 'In Development' },
  { value: 'On Track', label: 'On Track' },
  { value: 'At Risk', label: 'At Risk' },
  { value: 'Off Track', label: 'Off Track' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Bid Lost', label: 'Bid Lost' },
];

export type PaymentStatus = string;
export interface PaymentStatusDefinition {
  id: string;
  name: string;
  color: string;
  position: number;
}

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'Proposed', label: 'Proposed' },
  { value: 'Pending', label: 'Pending' },
  { value: 'In Process', label: 'In Process' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Bid Lost', label: 'Bid Lost' },
];

export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: ProjectStatus;
  payment_status: PaymentStatus;
  budget?: number | null;
  start_date?: string | null;
  due_date?: string | null;
  payment_due_date?: string | null;
  venue?: string | null;
  services?: string[] | null;
  client_name?: string | null;
  client_company_name?: string | null;
  client_avatar_url?: string | null;
  client_company_logo_url?: string | null;
  person_ids?: string[] | null;
  client_company_id?: string | null;
  created_by: Owner;
  assignedTo: AssignedUser[];
  tasks?: Task[];
  comments?: Comment[];
  briefFiles: ProjectFile[];
  activities: Activity[];
  tags: Tag[];
  reactions?: Reaction[];
  created_at: string;
  updated_at: string;
  origin_event_id?: string | null;
  public?: boolean;
  kanban_order?: number;
  position?: number;
  payment_kanban_order?: number;
  invoice_number?: string | null;
  po_number?: string | null;
  paid_date?: string | null;
  email_sending_date?: string | null;
  hardcopy_sending_date?: string | null;
  channel?: string | null;
  personal_for_user_id?: string | null;
  payment_terms?: any;
  progress?: number;
  total_task_count?: number;
  last_billing_reminder_sent_at?: string | null;
  invoice_attachments?: InvoiceAttachment[];
}

export interface ProjectFile {
  id: string;
  name: string;
  url: string;
  storage_path: string;
  size: number;
  type: string;
  created_at: string;
}

export interface Activity {
  id: string;
  type: string;
  details: { description: string };
  timestamp: string;
  user: { name: string };
  created_at: string;
}

// Tasks
export type TaskStatus = 'To do' | 'In progress' | 'In review' | 'Done';
export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'To do', label: 'To do' },
  { value: 'In progress', label: 'In progress' },
  { value: 'In review', label: 'In review' },
  { value: 'Done', label: 'Done' },
];

export type TaskPriority = 'Low' | 'Normal' | 'High' | 'Urgent';
export const TASK_PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
    { value: 'Low', label: 'Low' },
    { value: 'Normal', label: 'Normal' },
    { value: 'High', label: 'High' },
    { value: 'Urgent', label: 'Urgent' },
];

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  due_date?: string | null;
  priority: TaskPriority;
  project_id: string;
  project_name: string;
  project_slug: string;
  assignedTo: User[];
  created_by: User;
  created_at: string;
  updated_at: string;
  status: TaskStatus;
  tags: Tag[];
  origin_ticket_id?: string | null;
  reactions?: Reaction[];
  kanban_order?: number;
  attachments?: TaskAttachment[];
  ticket_attachments?: TaskAttachment[];
  attachment_url?: string;
  attachment_name?: string;
  last_reminder_sent_at?: string | null;
}

export interface UpsertTaskPayload {
  id?: string;
  project_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority?: TaskPriority | null;
  status?: TaskStatus;
  completed?: boolean;
  assignee_ids?: string[];
  tag_ids?: string[];
  new_files?: File[];
  deleted_files?: string[];
  origin_ticket_id?: string | null;
}

export interface TaskAttachment {
  id: string;
  file_name: string;
  file_url: string;
  storage_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
  name?: string; // for compatibility with ProjectFile
  url?: string; // for compatibility with ProjectFile
}

// Comments
export interface Comment {
  id: string;
  created_at: string;
  text: string | null;
  is_ticket: boolean;
  attachments_jsonb?: TaskAttachment[];
  author: User;
  reactions?: Reaction[];
  author_id: string;
  project_id: string;
  task_id?: string | null;
  reply_to_comment_id?: string | null;
  repliedMessage?: {
    content: string;
    senderName: string;
    isDeleted: boolean;
  } | null;
}

// People & Companies
export interface Person {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  job_title?: string | null;
  department?: string | null;
  social_media?: { [key: string]: string };
  birthday?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  projects?: Pick<Project, 'id' | 'name' | 'slug' | 'status'>[];
  tags?: Tag[];
  avatar_url?: string | null;
  user_id?: string | null;
  address?: any;
  contact?: { emails?: string[], phones?: string[] };
  company_id?: string | null;
  slug: string;
  kanban_order?: number;
  custom_properties?: Record<string, any>;
  company_logo_url?: string | null;
}

export interface Company {
  id: string;
  name: string;
  legal_name?: string | null;
  address?: string | null;
  logo_url?: string | null;
  custom_properties?: Record<string, any>;
  created_at: string;
  updated_at: string;
  slug: string;
}

// Tags
export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id: string | null;
  isNew?: boolean;
  type?: string;
  custom_properties?: Record<string, any>;
}

// Goals
export type GoalType = 'frequency' | 'quantity' | 'value';
export type GoalPeriod = 'Weekly' | 'Monthly';
export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  icon: string;
  icon_url?: string | null;
  color: string;
  type: GoalType;
  target_quantity?: number | null;
  target_value?: number | null;
  frequency?: 'Daily' | 'Weekly' | null;
  target_period?: GoalPeriod | null;
  unit?: string | null;
  specific_days?: string[] | null;
  created_at: string;
  updated_at: string;
  slug: string;
  tags: Tag[];
  collaborators: User[];
  completions: GoalCompletion[];
  reactions?: Reaction[];
}

export interface GoalCompletion {
  id: string;
  date: string;
  value: number;
  notes?: string | null;
  userId: string;
}

// Chat
export interface ChatMessageAttachment {
  name: string;
  url: string;
  type: string;
}

export interface Message {
  id: string;
  text: string | null;
  timestamp: string;
  sender: User;
  attachment?: ChatMessageAttachment;
  reply_to_message_id?: string | null;
  repliedMessage?: {
    content: string | null;
    senderName: string;
    isDeleted: boolean;
    attachment?: ChatMessageAttachment | null;
  } | null;
  reactions?: Reaction[];
  is_deleted?: boolean;
  is_forwarded?: boolean;
}

export interface Conversation {
  id: string;
  userName: string;
  userAvatar?: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  isGroup: boolean;
  members: Collaborator[];
  messages: Message[];
  created_by: string;
}

// Knowledge Base
export interface KbFolder {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  icon: string | null;
  color: string | null;
  category: string | null;
  access_level: FolderAccessLevel;
  updated_at: string;
  last_modified_by: string | null;
}

export type FolderAccessLevel = 'private' | 'public_view' | 'public_edit';

export interface KbArticle {
  id: string;
  title: string;
  slug: string;
  content: any;
  folder_id: string;
  updated_at: string;
  header_image_url: string | null;
  kb_folders: { name: string; slug: string };
  tags: Tag[];
  creator: User;
  kb_article_reactions?: ArticleReaction[];
}

export interface ArticleReaction {
  id: string;
  emoji: string;
  user_id: string;
  profiles?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
}

// Services
export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  icon_color: string;
  is_featured: boolean;
}

// Notifications
export interface AppNotification {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  link: string;
  actor: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

// Theme
export type Theme = "light" | "dark" | "system" | "claude" | "claude-light" | "nature" | "nature-light" | "corporate" | "corporate-light" | "ahensi" | "ahensi-light" | "brand-activator" | "brand-activator-light";

// Custom Properties
export const CUSTOM_PROPERTY_TYPES = [
  'text', 'textarea', 'number', 'date', 'email', 'phone', 'url', 'select', 'multi-select', 'checkbox', 'image'
] as const;
export type CustomPropertyType = typeof CUSTOM_PROPERTY_TYPES[number];
export interface CustomProperty {
  id: string;
  name: string;
  label: string;
  type: CustomPropertyType;
  options?: string[] | null;
  is_default: boolean;
  category: 'contact' | 'company' | 'project' | 'billing' | 'expense' | 'tag';
}

// Billing & Expenses
export interface Invoice {
  id: string;
  projectId: string;
  projectName: string;
  amount: number;
  dueDate: Date;
  status: PaymentStatus;
  rawProjectId: string;
  projectStartDate: Date | null;
  projectEndDate: Date | null;
  poNumber: string | null;
  paidDate: Date | null;
  emailSendingDate: Date | null;
  hardcopySendingDate: Date | null;
  channel: string | null;
  clientName: string | null;
  clientAvatarUrl: string | null;
  clientLogo: string | null;
  clientCompanyName: string | null;
  projectOwner: Owner | null;
  assignedMembers: Member[];
  invoice_attachments?: InvoiceAttachment[];
  payment_terms?: any[];
  last_billing_reminder_sent_at?: string | null;
}

export interface InvoiceAttachment {
  id: string;
  file_name: string;
  file_url: string;
  storage_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface Member {
  id: string;
  name: string;
  avatar_url: string;
  initials: string;
  role: 'owner' | 'admin' | 'member' | 'editor';
}

export interface Expense {
  id: string;
  project_id: string;
  project_name: string;
  project_slug: string;
  project_owner: Owner;
  beneficiary: string;
  tf_amount: number;
  status_expense: string;
  due_date: string | null;
  account_bank: { name: string; account: string; bank: string } | null;
  remarks: string | null;
  created_at: string;
  payment_terms?: any[];
  bank_account_id?: string | null;
  custom_properties?: Record<string, any>;
  kanban_order?: number;
}

export interface BankAccount {
  id: string;
  owner_id: string;
  owner_type: 'person' | 'company';
  account_name: string;
  account_number: string;
  bank_name: string;
  swift_code?: string | null;
  country?: string | null;
  city?: string | null;
  owner_name?: string;
  owner_avatar_url?: string | null;
  owner_slug?: string | null;
  is_legacy?: boolean;
}

export interface PublicationCampaign {
  id: string;
  user_id: string;
  name: string;
  sheet_url: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectStatusDef {
  id: string;
  name: string;
  color: string;
  position: number;
}