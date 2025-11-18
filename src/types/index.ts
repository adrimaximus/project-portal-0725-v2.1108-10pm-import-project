import { RealtimeChannel } from '@supabase/supabase-js';

export type Theme =
  | "light"
  | "dark"
  | "system"
  | "claude"
  | "claude-light"
  | "nature"
  | "nature-light"
  | "corporate"
  | "corporate-light"
  | "ahensi"
  | "ahensi-light"
  | "brand-activator"
  | "brand-activator-light";

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

export interface User {
  id: string;
  name?: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string;
  avatar_url?: string | null;
  role?: string;
  initials?: string;
  permissions?: string[];
  theme?: Theme;
  people_kanban_settings?: any;
  phone?: string | null;
  status?: string;
  updated_at?: string;
}

export type AssignedUser = User & { role: string };

export interface Collaborator extends User {
  isIdle?: boolean;
  last_active_at?: string;
}

export interface ChatMessageAttachment {
  name: string;
  url: string;
  type: string;
}

export interface ConversationMessage {
  sender: 'ai' | 'user';
  content: string;
}

export interface Message {
  id: string;
  text: string | null;
  timestamp: string;
  sender: User;
  attachment?: ChatMessageAttachment;
  reactions?: Reaction[];
  reply_to_message_id?: string | null;
  repliedMessage?: {
    content: string | null;
    senderName: string;
    isDeleted: boolean;
    attachment?: ChatMessageAttachment | null;
  } | null;
  is_deleted?: boolean;
  is_forwarded?: boolean;
}

export interface Conversation {
  id: string;
  userName: string;
  userAvatar?: string | null;
  isGroup: boolean;
  members: Collaborator[];
  messages: Message[];
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  created_by: string;
}

export interface Profile extends User {
  status?: string;
  sidebar_order?: any;
  notification_preferences?: any;
  permissions?: string[];
  theme?: Theme;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id: string | null;
  isNew?: boolean;
  type?: string | null;
  custom_properties?: Record<string, any> | null;
}

export const CUSTOM_PROPERTY_TYPES = [
  'text',
  'textarea',
  'number',
  'date',
  'email',
  'phone',
  'url',
  'image',
  'multi-image',
  'select',
  'multi-select',
  'checkbox',
] as const;

export interface CustomProperty {
  id: string;
  name: string;
  label: string;
  type: (typeof CUSTOM_PROPERTY_TYPES)[number];
  options?: string[] | null;
  is_default: boolean;
  category: 'contact' | 'company' | 'tag' | 'project' | 'billing' | 'expense';
}

export interface Reaction {
  id: string;
  emoji: string;
  user_id: string;
  user_name: string;
}

export interface Comment {
  id: string;
  text: string | null;
  created_at: string;
  author: User;
  reactions?: Reaction[];
  is_ticket: boolean;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachments_jsonb?: TaskAttachment[] | null;
  project_id: string;
  task_id: string | null;
  reply_to_comment_id?: string | null;
  repliedMessage?: {
    content: string;
    senderName: string;
    isDeleted: boolean;
  } | null;
}

export type TaskStatus = 'To do' | 'In progress' | 'In review' | 'Done';

export const TASK_STATUS_OPTIONS: { value: TaskStatus, label: string }[] = [
  { value: 'To do', label: 'To Do' },
  { value: 'In progress', label: 'In Progress' },
  { value: 'In review', label: 'In Review' },
  { value: 'Done', label: 'Done' },
];

export type TaskPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export const TASK_PRIORITY_OPTIONS: { value: TaskPriority, label: string }[] = [
  { value: 'Low', label: 'Low' },
  { value: 'Normal', label: 'Normal' },
  { value: 'High', label: 'High' },
  { value: 'Urgent', label: 'Urgent' },
];

export interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  due_date: string | null;
  priority: TaskPriority;
  project_id: string;
  project_name: string;
  project_slug: string;
  project_status: string;
  assignedTo: User[];
  created_by: User;
  created_at: string;
  updated_at: string;
  status: TaskStatus;
  tags: Tag[];
  origin_ticket_id: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachments?: TaskAttachment[];
  project_venue?: string | null;
  project_owner: User | null;
  project_client?: string | null;
  reactions: Reaction[];
  kanban_order: number;
  ticket_attachments?: TaskAttachment[];
  last_reminder_sent_at?: string | null;
}

export interface Activity {
  id: string;
  type: string;
  details: {
    description: string;
  };
  timestamp: string;
  user: {
    id: string;
    name: string;
    avatar_url: string | null;
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

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  status: ProjectStatus;
  progress: number;
  total_task_count?: number;
  active_task_count?: number;
  budget: number | null;
  start_date: string | null;
  due_date: string | null;
  payment_status: PaymentStatus;
  payment_due_date: string | null;
  created_by: User;
  assignedTo: AssignedUser[];
  tasks: Task[];
  comments: Comment[];
  services: string[];
  briefFiles: any[];
  activities: Activity[];
  tags: Tag[];
  client_name: string | null;
  client_avatar_url: string | null;
  client_company_logo_url: string | null;
  client_company_name: string | null;
  client_company_custom_properties: any | null;
  client_company_id: string | null;
  reactions: Reaction[];
  public: boolean;
  venue?: string | null;
  origin_event_id?: string | null;
  created_at: string;
  updated_at: string;
  personal_for_user_id?: string | null;
  invoice_number?: string | null;
  po_number?: string | null;
  paid_date?: string | null;
  email_sending_date?: string | null;
  hardcopy_sending_date?: string | null;
  channel?: string | null;
  invoice_attachments?: InvoiceAttachment[];
  payment_terms?: any[];
  last_billing_reminder_sent_at?: string | null;
}

export type ProjectStatus = 'On Track' | 'At Risk' | 'Off Track' | 'On Hold' | 'Completed' | 'Archived' | 'Cancelled' | 'Bid Lost' | 'Billing Process' | 'In Progress' | 'Pending' | 'Requested' | 'Planning' | 'Reschedule';

export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus, label: string }[] = [
    { value: 'On Track', label: 'On Track' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Requested', label: 'Requested' },
    { value: 'Planning', label: 'Planning' },
    { value: 'At Risk', label: 'At Risk' },
    { value: 'Off Track', label: 'Off Track' },
    { value: 'On Hold', label: 'On Hold' },
    { value: 'Reschedule', label: 'Reschedule' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Billing Process', label: 'Billing Process' },
    { value: 'Archived', label: 'Archived' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'Bid Lost', label: 'Bid Lost' },
];

export type PaymentStatus = 'Paid' | 'Overdue' | 'Partially Paid' | 'Unpaid' | 'Pending' | 'In Process' | 'Requested' | 'Invoiced' | 'Quo Approved' | 'Inv Approved' | 'Proposed' | 'Cancelled' | 'Bid Lost';

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus, label: string }[] = [
    { value: 'Paid', label: 'Paid' },
    { value: 'Overdue', label: 'Overdue' },
    { value: 'Partially Paid', label: 'Partially Paid' },
    { value: 'Unpaid', label: 'Unpaid' },
    { value: 'Pending', label: 'Pending' },
    { value: 'In Process', label: 'In Process' },
    { value: 'Requested', label: 'Requested' },
    { value: 'Invoiced', label: 'Invoiced' },
    { value: 'Quo Approved', label: 'Quotation Approved' },
    { value: 'Inv Approved', label: 'Invoice Approved' },
    { value: 'Proposed', label: 'Proposed' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'Bid Lost', label: 'Bid Lost' },
];

export interface TaskAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  created_at: string;
}

export interface UpsertTaskPayload {
  id?: string | null;
  project_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  completed?: boolean;
  assignee_ids?: string[];
  tag_ids?: string[];
  origin_ticket_id?: string | null;
  new_files?: File[];
  deleted_files?: string[];
}

export interface Person {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  company_id?: string | null;
  job_title?: string | null;
  department?: string | null;
  social_media?: { [key: string]: string } | null;
  birthday?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  projects?: { id: string; name: string; slug: string; status: string; start_date: string }[] | null;
  tags?: Tag[] | null;
  avatar_url?: string | null;
  user_id?: string | null;
  address?: any | null;
  contact?: { emails?: string[]; phones?: string[] } | null;
  slug: string;
  kanban_order?: number;
  custom_properties?: Record<string, any> | null;
  company_logo_url?: string | null;
}

export interface Company {
  id: string;
  name: string;
  legal_name?: string | null;
  address?: string | null;
  billing_address?: string | null;
  logo_url?: string | null;
  created_at: string;
  updated_at: string;
  user_id?: string | null;
  custom_properties?: Record<string, any> | null;
  slug?: string;
}

export interface AdvancedFiltersState {
  ownerIds: string[];
  memberIds: string[];
  excludedStatus: string[];
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  icon_color: string;
  is_featured: boolean;
  created_at?: string;
}

export type GoalType = 'frequency' | 'quantity' | 'value';
export type GoalPeriod = 'Weekly' | 'Monthly';

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
  frequency: 'Daily' | 'Weekly' | 'Monthly' | null;
  target_period: GoalPeriod | null;
  unit: string | null;
  specific_days: string[] | null;
  created_at: string;
  updated_at: string;
  slug: string;
  tags: Tag[];
  collaborators: User[];
  completions: GoalCompletion[];
  reactions: Reaction[];
}

export type FolderAccessLevel = 'private' | 'public_view' | 'public_edit';

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
}

export interface ArticleReaction {
  id: string;
  emoji: string;
  user_id: string;
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export interface KbArticle {
  id: string;
  title: string;
  slug: string;
  content: any; // JSONB
  folder_id: string;
  updated_at: string;
  header_image_url: string | null;
  kb_folders: {
    name: string;
    slug: string;
  };
  tags: Tag[];
  creator: {
    id: string;
    name: string;
    avatar_url: string | null;
    initials: string;
  };
  kb_article_reactions?: ArticleReaction[];
}

export type Owner = User;
export type Member = AssignedUser;

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

export interface BankAccount {
  id: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  swift_code?: string | null;
  country?: string | null;
  city?: string | null;
  owner_id: string;
  owner_type: 'person' | 'company';
  owner_name?: string;
  owner_avatar_url?: string | null;
  owner_slug?: string | null;
  is_legacy?: boolean;
}

export interface Expense {
  id: string;
  project_id: string;
  project_name: string;
  project_slug: string;
  project_owner: {
    id: string;
    name: string;
    avatar_url: string;
    initials: string;
  };
  beneficiary: string;
  tf_amount: number;
  status_expense: string;
  due_date: string;
  account_bank: { name: string; account: string; bank: string };
  remarks: string;
  created_at: string;
  payment_terms: any[];
  bank_account_id: string | null;
  custom_properties?: Record<string, any> | null;
  kanban_order?: number;
}