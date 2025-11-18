// Basic Types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// User and Auth
export interface User {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  initials: string;
  role?: string;
  status?: string;
  first_name?: string | null;
  last_name?: string | null;
  updated_at?: string;
  permissions?: string[];
  people_kanban_settings?: any;
  theme?: string;
  phone?: string | null;
}

export type Collaborator = User & {
  online?: boolean;
  isIdle?: boolean;
  last_active_at?: string;
};

export type Owner = Pick<User, 'id' | 'name' | 'avatar_url' | 'initials' | 'email'>;
export type AssignedUser = Pick<User, 'id' | 'name' | 'avatar_url' | 'initials' | 'role' | 'email'>;

// Enums and Constants
export const PROJECT_STATUS_OPTIONS = [
  { value: 'On Track', label: 'On Track' },
  { value: 'At Risk', label: 'At Risk' },
  { value: 'Off Track', label: 'Off Track' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Planning', label: 'Planning' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Billing Process', label: 'Billing Process' },
] as const;
export type ProjectStatus = typeof PROJECT_STATUS_OPTIONS[number]['value'];

export const PAYMENT_STATUS_OPTIONS = [
    { value: 'Paid', label: 'Paid' },
    { value: 'Unpaid', label: 'Unpaid' },
    { value: 'Overdue', label: 'Overdue' },
    { value: 'Pending', label: 'Pending' },
    { value: 'In Process', label: 'In Process' },
    { value: 'Proposed', label: 'Proposed' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'Bid Lost', label: 'Bid Lost' },
    { value: 'Requested', label: 'Requested' },
    { value: 'Quo Approved', label: 'Quo Approved' },
    { value: 'Inv Approved', label: 'Inv Approved' },
    { value: 'Partially Paid', label: 'Partially Paid' },
] as const;
export type PaymentStatus = typeof PAYMENT_STATUS_OPTIONS[number]['value'];

export const TASK_STATUS_OPTIONS = [
  { value: 'To do', label: 'To do' },
  { value: 'In progress', label: 'In progress' },
  { value: 'In review', label: 'In review' },
  { value: 'Done', label: 'Done' },
] as const;
export type TaskStatus = typeof TASK_STATUS_OPTIONS[number]['value'];

export const TASK_PRIORITY_OPTIONS = [
  { value: 'Urgent', label: 'Urgent' },
  { value: 'High', label: 'High' },
  { value: 'Normal', label: 'Normal' },
  { value: 'Low', label: 'Low' },
] as const;
export type TaskPriority = typeof TASK_PRIORITY_OPTIONS[number]['value'];

// Main Data Models
export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: ProjectStatus;
  payment_status: PaymentStatus;
  progress: number;
  created_at: string;
  updated_at?: string;
  start_date?: string;
  due_date?: string;
  budget?: number;
  category?: string;
  venue?: string;
  created_by: Owner;
  assignedTo: AssignedUser[];
  tasks?: Task[];
  comments?: Comment[];
  activities?: Activity[];
  briefFiles: ProjectFile[];
  services?: string[];
  tags?: Tag[];
  reactions?: Reaction[];
  client_name?: string;
  client_avatar_url?: string;
  client_company_name?: string;
  client_company_logo_url?: string;
  client_company_id?: string | null;
  personal_for_user_id?: string | null;
  invoice_number?: string;
  po_number?: string;
  paid_date?: string;
  email_sending_date?: string;
  hardcopy_sending_date?: string;
  channel?: string;
  payment_due_date?: string;
  payment_terms?: any[];
  invoice_attachments?: InvoiceAttachment[];
  last_billing_reminder_sent_at?: string;
  total_task_count?: number;
  people?: Person[];
  person_ids?: string[];
  origin_event_id?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  due_date: string | null;
  priority: TaskPriority;
  project_id: string;
  project_name: string;
  project_slug: string;
  assignedTo: User[];
  created_by: User;
  created_at: string;
  updated_at: string;
  status: TaskStatus;
  tags?: Tag[];
  reactions?: Reaction[];
  origin_ticket_id?: string;
  kanban_order?: number;
  attachments?: TaskAttachment[];
  ticket_attachments?: TaskAttachment[];
  attachment_url?: string;
  attachment_name?: string;
  last_reminder_sent_at?: string | null;
}

export interface Comment {
  id: string;
  text: string | null;
  created_at: string;
  author: User;
  is_ticket: boolean;
  reactions?: Reaction[];
  attachments_jsonb?: TaskAttachment[];
  reply_to_comment_id?: string | null;
  repliedMessage?: {
    content: string;
    senderName: string;
    isDeleted: boolean;
    attachment?: ChatMessageAttachment | null;
  } | null;
}

export interface Reaction {
  id: string;
  emoji: string;
  user_id: string;
  user_name: string;
  profiles?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  }
}

export interface Activity {
  id: string;
  type: string;
  details: { description: string };
  timestamp: string;
  user: {
    id: string;
    name: string;
    avatar_url: string;
    initials: string;
  };
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

export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id: string | null;
  isNew?: boolean;
  type?: string;
  custom_properties?: Record<string, any>;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  icon_color: string;
  is_featured: boolean;
}

export interface Person {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  job_title?: string | null;
  department?: string | null;
  birthday?: string | null;
  notes?: string | null;
  avatar_url?: string | null;
  user_id?: string | null;
  created_at: string;
  updated_at: string;
  projects?: Pick<Project, 'id' | 'name' | 'slug' | 'status'>[];
  tags?: Tag[];
  contact?: {
    emails?: string[];
    phones?: string[];
  };
  social_media?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
  address?: any;
  slug: string;
  company_id?: string | null;
  custom_properties?: Record<string, any>;
  kanban_order?: number;
}

export interface Company {
  id: string;
  name: string;
  legal_name?: string | null;
  address?: string | null;
  logo_url?: string | null;
  custom_properties?: Record<string, any>;
  slug?: string;
  updated_at: string;
}

export interface KbFolder {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  slug: string;
  updated_at: string;
  category?: string | null;
  access_level?: FolderAccessLevel;
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
  creator: {
    id: string;
    name: string;
    avatar_url: string;
    initials: string;
  };
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
    avatar_url: string;
  };
}

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
  collaborators: Collaborator[];
  completions: GoalCompletion[];
  reactions?: Reaction[];
}

export interface GoalCompletion {
  id: string;
  date: string;
  value: number;
  notes?: string;
  userId: string;
}

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
  invoiceAttachments: InvoiceAttachment[];
  payment_terms: any[];
  last_billing_reminder_sent_at: string | null;
}

export interface Member extends User {
  role: 'owner' | 'admin' | 'member' | 'editor';
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

export interface Expense {
  id: string;
  project_id: string;
  project_name: string;
  project_slug: string;
  project_owner: Owner;
  beneficiary: string;
  tf_amount: number;
  status_expense: string;
  due_date?: string;
  account_bank?: {
    name: string;
    account: string;
    bank: string;
  };
  remarks?: string;
  created_at: string;
  kanban_order?: number;
  custom_properties?: Record<string, any>;
}

export interface BankAccount {
  id: string;
  owner_id: string;
  owner_type: 'person' | 'company';
  account_name: string;
  account_number: string;
  bank_name: string;
  swift_code?: string;
  country?: string;
  city?: string;
  owner_name?: string;
  owner_avatar_url?: string;
  owner_slug?: string;
  is_legacy?: boolean;
}

export const CUSTOM_PROPERTY_TYPES = [
  'text', 'textarea', 'number', 'date', 'email', 'phone', 'url', 'image', 'select', 'multi-select', 'checkbox'
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
  userAvatar: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  isGroup: boolean;
  members: Collaborator[];
  messages: Message[];
  created_by: string;
}

export interface ConversationMessage {
  sender: 'ai' | 'user';
  content: string;
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
  origin_ticket_id?: string;
}

export type Theme = "light" | "dark" | "system" | "claude" | "claude-light" | "nature" | "nature-light" | "corporate" | "corporate-light" | "ahensi" | "ahensi-light" | "brand-activator" | "brand-activator-light";

export interface TaskAttachment {
  id?: string;
  file_url: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  created_at: string;
  url?: string; // for compatibility
  name?: string; // for compatibility
}

export interface AdvancedFiltersState {
  ownerIds: string[];
  memberIds: string[];
  excludedStatus: string[];
}