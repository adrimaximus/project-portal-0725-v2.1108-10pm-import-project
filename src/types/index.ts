export type PaymentStatus = 'Unpaid' | 'Paid' | 'Overdue' | 'Pending' | 'Proposed' | 'In Process' | 'Cancelled' | 'Refunded';

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'Proposed', label: 'Proposed' },
  { value: 'Unpaid', label: 'Unpaid' },
  { value: 'In Process', label: 'In Process' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Refunded', label: 'Refunded' },
];

export type ProjectStatus = 'On Track' | 'At Risk' | 'Off Track' | 'On Hold' | 'Completed' | 'Cancelled' | 'Bid Lost' | 'Requested' | 'Proposed';

export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'Requested', label: 'Requested' },
  { value: 'Proposed', label: 'Proposed' },
  { value: 'On Track', label: 'On Track' },
  { value: 'At Risk', label: 'At Risk' },
  { value: 'Off Track', label: 'Off Track' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Bid Lost', label: 'Bid Lost' },
];

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

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string | null;
  initials?: string;
  role?: string;
  status?: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  permissions?: string[];
  people_kanban_settings?: any;
  updated_at?: string;
  theme?: string;
  projects?: { id: string; name: string }[];
}

export interface Collaborator {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string | null;
  initials?: string;
  first_name?: string | null;
  last_name?: string | null;
  isIdle?: boolean;
  last_active_at?: string;
  online?: boolean;
}

export interface AssignedUser extends Collaborator {
  role?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id: string;
  isNew?: boolean;
  type?: string;
  custom_properties?: Record<string, any>;
}

export interface Reaction {
  id: string;
  emoji: string;
  user_id: string;
  user_name: string;
  created_at?: string;
  profiles?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export interface TaskAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  created_at: string;
  url?: string; // Legacy support
  name?: string; // Legacy support
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  due_date?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  project_id: string;
  project_name?: string;
  project_slug?: string;
  assignedTo?: User[];
  created_by?: User;
  created_at: string;
  updated_at?: string;
  tags?: Tag[];
  attachments?: TaskAttachment[];
  ticket_attachments?: TaskAttachment[];
  reactions?: Reaction[];
  kanban_order?: number;
  origin_ticket_id?: string;
  attachment_url?: string; // Legacy
  attachment_name?: string; // Legacy
  last_reminder_sent_at?: string;
}

export interface Comment {
  id: string;
  text: string;
  created_at: string;
  author: User | Collaborator;
  is_ticket?: boolean;
  attachments_jsonb?: any[];
  reactions?: Reaction[];
  reply_to_comment_id?: string | null;
  repliedMessage?: {
    content: string;
    senderName: string;
    isDeleted?: boolean;
  } | null;
  project_id?: string;
  task_id?: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  storage_path: string;
  created_at: string;
}

export interface ProjectActivity {
  id: string;
  type: string;
  timestamp: string;
  details: any;
  user?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  project_name?: string;
  project_slug?: string;
  user_name?: string;
  user_avatar_url?: string;
  user_initials?: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  budget?: number;
  start_date?: string;
  due_date?: string;
  venue?: string;
  payment_status?: PaymentStatus;
  payment_due_date?: string;
  created_by: User;
  created_at: string;
  updated_at: string;
  client_company_id?: string | null;
  client_name?: string;
  client_avatar_url?: string;
  client_company_name?: string;
  client_company_logo_url?: string;
  assignedTo: AssignedUser[];
  tasks?: Task[];
  comments?: Comment[];
  activities?: ProjectActivity[];
  briefFiles?: ProjectFile[];
  services?: string[];
  tags?: Tag[];
  reactions?: Reaction[];
  invoice_number?: string;
  po_number?: string;
  paid_date?: string;
  email_sending_date?: string;
  hardcopy_sending_date?: string;
  channel?: string;
  personal_for_user_id?: string;
  invoice_attachments?: InvoiceAttachment[];
  payment_terms?: any[];
  last_billing_reminder_sent_at?: string;
  category?: string;
  total_task_count?: number;
  origin_event_id?: string;
  active_task_count?: number;
}

export interface InvoiceAttachment {
  id: string;
  file_name: string;
  file_url: string;
  storage_path: string;
  file_type?: string;
  file_size?: number;
  created_at?: string;
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
  projectOwner: { id: string; name: string; avatar_url?: string | null; initials?: string } | null;
  assignedMembers: { id: string; name: string; role: string; avatar_url?: string | null; initials?: string }[];
  invoiceAttachments: InvoiceAttachment[];
  payment_terms: any[];
  last_billing_reminder_sent_at: string | null;
}

export interface Member {
  id: string;
  name: string;
  role: string;
  avatar_url?: string | null;
  initials?: string;
}

export interface Owner {
  id: string;
  name: string;
  avatar_url?: string | null;
  initials?: string;
}

export interface Person {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  job_title?: string | null;
  department?: string | null;
  avatar_url?: string | null;
  address?: any;
  social_media?: any;
  tags?: Tag[];
  contact?: { emails?: string[]; phones?: string[] };
  company_id?: string | null;
  company_logo_url?: string | null;
  user_id?: string | null;
  slug?: string;
  updated_at?: string;
  created_at?: string;
  notes?: string | null;
  projects?: { id: string; name: string; slug: string; status: string }[];
  custom_properties?: Record<string, any>;
  birthday?: string | null;
}

export interface Company {
  id: string;
  name: string;
  logo_url?: string | null;
  slug?: string;
  legal_name?: string | null;
  address?: string | null;
  updated_at?: string;
  created_at?: string;
  custom_properties?: Record<string, any>;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  icon_color?: string;
  is_featured?: boolean;
  created_at?: string;
}

export interface CustomProperty {
  id: string;
  name: string;
  label: string;
  type: string;
  category: 'contact' | 'company' | 'project' | 'billing' | 'expense' | 'tag';
  options?: string[] | null;
  is_default?: boolean;
}

export const CUSTOM_PROPERTY_TYPES = ['text', 'textarea', 'number', 'date', 'select', 'multi-select', 'checkbox', 'email', 'phone', 'url', 'image'] as const;

export type GoalType = 'frequency' | 'quantity' | 'value';
export type GoalPeriod = 'Weekly' | 'Monthly' | 'Yearly';

export interface GoalCompletion {
  id: string;
  date: string;
  value: number;
  userId: string;
  notes?: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  type: GoalType;
  frequency?: 'Daily' | 'Weekly' | 'Monthly';
  specific_days?: string[];
  target_quantity?: number;
  target_period?: GoalPeriod;
  target_value?: number;
  unit?: string;
  icon: string;
  icon_url?: string;
  color: string;
  slug: string;
  created_at: string;
  tags: Tag[];
  collaborators: User[];
  completions: GoalCompletion[];
  reactions?: Reaction[];
}

export interface KbFolder {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  slug: string;
  category?: string;
  access_level?: 'private' | 'public_view' | 'public_edit';
  updated_at: string;
  user_id: string;
}

export interface KbArticle {
  id: string;
  title: string;
  content: any; // JSON or string
  slug: string;
  folder_id: string;
  user_id: string;
  updated_at: string;
  created_at: string;
  header_image_url?: string;
  kb_folders: { name: string; slug: string };
  tags: Tag[];
  creator?: { id: string; name: string; avatar_url?: string; initials?: string };
  kb_article_reactions?: ArticleReaction[];
}

export interface ArticleReaction {
  id: string;
  emoji: string;
  user_id: string;
  profiles?: { id: string; first_name: string | null; last_name: string | null };
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  link?: string;
  actor?: {
    id: string;
    name: string;
    avatar_url?: string | null;
  };
}

export interface ChatMessageAttachment {
  name: string;
  url: string;
  type: string;
}

export interface Message {
  id: string;
  text: string;
  timestamp: string;
  sender: User | Collaborator;
  attachment?: ChatMessageAttachment;
  reply_to_message_id?: string | null;
  repliedMessage?: {
    content: string;
    senderName: string;
    isDeleted?: boolean;
    attachment?: ChatMessageAttachment | null;
  } | null;
  reactions?: Reaction[];
  is_deleted?: boolean;
  is_forwarded?: boolean;
  updated_at?: string;
}

export interface Conversation {
  id: string;
  userName: string;
  userAvatar?: string | null;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  isGroup: boolean;
  members: Collaborator[];
  messages: Message[];
  created_by?: string;
}

// Type alias for Message to ConversationMessage to fix some imports
export type ConversationMessage = Message;

export type UpsertTaskPayload = {
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
};

export type Activity = ProjectActivity;

export interface Expense {
  id: string;
  project_id: string;
  project_name: string;
  project_slug: string;
  project_owner: { id: string; name: string; avatar_url?: string | null; initials?: string };
  beneficiary: string;
  tf_amount: number;
  status_expense: string;
  due_date?: string;
  account_bank?: { name: string; account: string; bank: string };
  remarks?: string;
  created_at: string;
  payment_terms?: any[];
  bank_account_id?: string;
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
  swift_code?: string;
  country?: string;
  city?: string;
  owner_name?: string;
  owner_avatar_url?: string;
  owner_slug?: string;
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

export type AdvancedFiltersState = {
  ownerIds: string[];
  memberIds: string[];
  excludedStatus: string[];
};

export interface ProjectStatusDef {
  id: string;
  name: string;
  color: string;
  position: number;
}

export type Theme = "dark" | "light" | "system" | "claude" | "claude-light" | "nature" | "nature-light" | "corporate" | "corporate-light" | "ahensi" | "ahensi-light" | "brand-activator" | "brand-activator-light";