import { Json } from './supabase';
import { ProjectStatus, PaymentStatus, TaskPriority, TaskStatus } from '@/data/projectOptions';

// --- Derived Types ---

export type ProjectStatus = ProjectStatus;
export type PaymentStatus = PaymentStatus;
export type TaskPriority = TaskPriority;
export type TaskStatus = TaskStatus;
export type CustomPropertyType = CustomProperty['type'];
export const CUSTOM_PROPERTY_TYPES = ['text', 'textarea', 'number', 'date', 'email', 'phone', 'url', 'image', 'select', 'multi-select', 'checkbox'] as const;

// --- Re-exporting Constants ---
export { PROJECT_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '@/data/projectOptions';

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  sidebar_order: Json | null;
  notification_preferences: Json | null;
  people_kanban_settings: Json | null;
  google_calendar_settings: Json | null;
  theme: string | null;
  phone: string | null;
  project_filters: Json | null;
  soniox_settings: Json | null;
  last_active_at: string | null;
}

export interface Company {
  id: string;
  name: string;
  legal_name: string | null;
  address: string | Json | null;
  billing_address: string | null;
  logo_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_id: string | null;
  custom_properties: Json | null;
  slug: string;
}

export interface Person {
  id: string;
  full_name: string;
  contact: Json | null;
  company: string | null;
  job_title: string | null;
  department: string | null;
  birthday: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  avatar_url: string | null;
  user_id: string | null;
  email: string | null;
  phone: string | null;
  custom_properties: Json | null;
  kanban_order: number | null;
  company_id: string | null;
  slug: string;
  address: Json | null;
  social_media: Json | null;
}

export interface Project {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  name: string;
  category: string | null;
  description: string | null;
  status: string | null;
  progress: number | null;
  budget: number | null;
  start_date: string | null;
  due_date: string | null;
  payment_status: string;
  created_by: string;
  origin_event_id: string | null;
  payment_due_date: string | null;
  slug: string;
  public: boolean | null;
  venue: string | null;
  kanban_order: number | null;
  position: number | null;
  payment_kanban_order: number | null;
  invoice_number: string | null;
  email_sending_date: string | null;
  hardcopy_sending_date: string | null;
  channel: string | null;
  po_number: string | null;
  paid_date: string | null;
  invoice_attachment_url: string | null;
  invoice_attachment_name: string | null;
  client_company_id: string | null;
  personal_for_user_id: string | null;
  payment_terms: Json | null;
  active_task_count: number;
  active_ticket_count: number;
  total_task_count: number;
}

export interface CustomProperty {
  id: string;
  name: string;
  label: string;
  type: string;
  options: Json | null;
  is_default: boolean | null;
  created_at: string | null;
  category: string;
}

export interface Expense {
  id: string;
  project_id: string;
  created_by: string | null;
  beneficiary: string;
  tf_amount: number;
  status_expense: string;
  due_date: string | null;
  account_bank: Json | null;
  remarks: string | null;
  created_at: string | null;
  updated_at: string | null;
  payment_terms: Json | null;
  bank_account_id: string | null;
  kanban_order: number | null;
  custom_properties: Json | null;
  purpose_payment: string | null;
  attachments_jsonb: Json | null;
  project_name: string;
  project_slug: string;
  project_owner: { id: string; name: string; avatar_url: string; initials: string } | null;
  pic: { id: string; name: string; avatar_url: string; initials: string; email: string } | null;
}

export interface BankAccount {
  id: string;
  owner_id: string;
  owner_type: 'person' | 'company';
  account_name: string;
  account_number: string;
  bank_name: string;
  swift_code: string | null;
  country: string | null;
  city: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  is_legacy?: boolean;
}

// --- Derived Types ---

export interface ProjectStatusDef {
  id: string;
  name: ProjectStatus;
  color: string;
  position: number;
}

export interface PaymentStatusDef {
  id: string;
  name: PaymentStatus;
  color: string;
  position: number;
}

export interface TaskAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  project_name: string;
  project_slug: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: TaskPriority | null;
  status: TaskStatus | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
  created_by: Owner;
  assignedTo: AssignedUser[] | null;
  tags: Tag[] | null;
  reactions: Reaction[] | null;
  attachments: TaskAttachment[] | null;
  ticket_attachments: TaskAttachment[] | null;
  origin_ticket_id: string | null;
  kanban_order: number | null;
  last_reminder_sent_at: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
}

export interface UpsertTaskPayload {
  id?: string;
  project_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority?: TaskPriority | null;
  status?: TaskStatus | null;
  completed?: boolean;
  assignee_ids?: string[];
  tag_ids?: string[];
  new_files?: File[];
  deleted_files?: string[];
  origin_ticket_id?: string | null;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id: string | null;
  isNew?: boolean;
  custom_properties?: Json | null;
  type?: string | null;
}

export interface Owner {
  id: string;
  name: string;
  avatar_url: string | null;
  initials: string;
  email: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

export interface AssignedUser extends Owner {
  role: 'admin' | 'member' | 'owner';
}

export interface Collaborator extends Owner {
  email: string;
  online?: boolean;
  isIdle?: boolean;
}

export interface Reaction {
  id: string;
  emoji: string;
  user_id: string;
  user_name: string;
}

export interface Comment {
  id: string;
  project_id: string;
  task_id: string | null;
  author: Owner;
  text: string | null;
  created_at: string;
  reactions: Reaction[] | null;
  is_ticket: boolean;
  attachments_jsonb: Json | null;
  reply_to_comment_id: string | null;
  repliedMessage?: {
    content: string | null;
    senderName: string;
    isDeleted: boolean;
    attachment?: ChatMessageAttachment | null;
  } | null;
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
  sender: Collaborator;
  attachment?: ChatMessageAttachment;
  reply_to_message_id?: string | null;
  repliedMessage?: {
    content: string | null;
    senderName: string;
    isDeleted: boolean;
    attachment?: ChatMessageAttachment | null;
  } | null;
  reactions?: Reaction[] | null;
  is_deleted?: boolean;
  is_forwarded?: boolean;
}

export interface Conversation {
  id: string;
  userName: string;
  userAvatar: string | null;
  isGroup: boolean;
  members: Collaborator[];
  messages: Message[];
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  created_by: string;
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
    avatar_url: string | null;
  };
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  icon_color: string;
  is_featured: boolean;
  created_at: string;
}

export interface GoalCompletion {
  id: string;
  date: string;
  value: number;
  userId: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'frequency' | 'quantity' | 'value';
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  specific_days: string[] | null;
  target_quantity: number | null;
  target_period: 'Weekly' | 'Monthly' | null;
  target_value: number | null;
  unit: string | null;
  color: string;
  icon: string;
  user_id: string;
  slug: string;
  tags: Tag[];
  collaborators: Collaborator[];
  reactions: Reaction[] | null;
}

export interface KbFolder {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  category: string | null;
  access_level: 'private' | 'public_view' | 'public_edit';
  slug: string;
  collaborators: Collaborator[];
}

export interface KbArticle {
  id: string;
  title: string;
  content: Json | null;
  folder_id: string;
  header_image_url: string | null;
  slug: string;
  created_at: string;
  updated_at: string;
  kb_folders: KbFolder;
  tags: Tag[] | null;
  creator: Owner | null;
  kb_article_reactions: ArticleReaction[] | null;
}

export interface ArticleReaction {
  id: string;
  emoji: string;
  user_id: string;
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export interface PublicationCampaign {
  id: string;
  user_id: string;
  name: string;
  sheet_url: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  created_at: string;
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
  assignedMembers: AssignedUser[];
  invoiceAttachments: InvoiceAttachment[];
  payment_terms: Json | null;
  last_billing_reminder_sent_at: string | null;
}

export interface Member extends AssignedUser {}
export interface Owner extends Owner {}

export interface AdvancedFiltersState {
  ownerIds: string[];
  memberIds: string[];
  excludedStatus: string[];
}

export type Theme = 'light' | 'dark' | 'system' | 'claude' | 'claude-light' | 'nature' | 'nature-light' | 'corporate' | 'corporate-light' | 'ahensi' | 'ahensi-light' | 'brand-activator' | 'brand-activator-light';

export interface FileMetadata {
  name: string;
  url: string;
  size: number;
  type: string;
  storagePath: string;
}