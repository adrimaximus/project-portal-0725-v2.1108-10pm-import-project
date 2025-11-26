export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  icon_color?: string;
  is_featured?: boolean;
  created_at?: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  initials?: string;
  role?: string;
  status?: string;
  updated_at?: string;
  first_name?: string | null;
  last_name?: string | null;
  permissions?: string[];
  theme?: string;
}

export type ProjectStatus = 'On Track' | 'At Risk' | 'Off Track' | 'On Hold' | 'Completed';

export const PROJECT_STATUS_OPTIONS = [
  { value: 'On Track', label: 'On Track' },
  { value: 'At Risk', label: 'At Risk' },
  { value: 'Off Track', label: 'Off Track' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Completed', label: 'Completed' },
];

export type PaymentStatus = 'Paid' | 'Unpaid' | 'Overdue' | 'Pending' | 'Proposed' | 'In Process' | 'Cancelled' | 'Bid Lost' | 'Quo Approved' | 'Inv Approved' | 'Partially Paid' | 'Refunded' | 'Void';

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'Proposed', label: 'Proposed' },
  { value: 'Quo Approved', label: 'Quotation Approved' },
  { value: 'Inv Approved', label: 'Invoice Approved' },
  { value: 'In Process', label: 'In Process' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Unpaid', label: 'Unpaid' },
  { value: 'Partially Paid', label: 'Partially Paid' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'Refunded', label: 'Refunded' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Bid Lost', label: 'Bid Lost' },
  { value: 'Void', label: 'Void' },
];

export interface AssignedUser extends User {
  role?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  isNew?: boolean;
  user_id?: string;
  type?: string;
  custom_properties?: Record<string, any>;
}

export interface Reaction {
  id: string;
  emoji: string;
  user_id: string;
  user_name: string;
}

export interface TaskAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  created_at: string;
  uploaded_by?: string;
  name?: string; // For compatibility
  url?: string; // For compatibility
}

export type TaskStatus = 'To do' | 'In progress' | 'In review' | 'Done';

export const TASK_STATUS_OPTIONS = [
  { value: 'To do', label: 'To Do' },
  { value: 'In progress', label: 'In Progress' },
  { value: 'In review', label: 'In Review' },
  { value: 'Done', label: 'Done' },
];

export type TaskPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export const TASK_PRIORITY_OPTIONS = [
  { value: 'Low', label: 'Low' },
  { value: 'Normal', label: 'Normal' },
  { value: 'High', label: 'High' },
  { value: 'Urgent', label: 'Urgent' },
];

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  assignee?: string; // Deprecated
  assignedTo?: User[];
  project_id: string;
  project_name?: string;
  project_slug?: string;
  due_date?: string | null;
  description?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  created_at: string;
  updated_at?: string;
  tags?: Tag[];
  created_by?: any;
  attachments?: TaskAttachment[];
  ticket_attachments?: TaskAttachment[];
  origin_ticket_id?: string;
  reactions?: Reaction[];
  attachment_url?: string; // Legacy
  attachment_name?: string; // Legacy
  kanban_order?: number;
}

export interface ProjectFile {
  id: string;
  name: string;
  url: string;
  storage_path: string;
  size: number;
  type: string;
  created_at?: string;
}

export interface Comment {
  id: string;
  text: string;
  created_at: string;
  author: User;
  is_ticket?: boolean;
  attachments_jsonb?: any[]; // For raw DB response
  project_id?: string;
  task_id?: string;
  reactions?: Reaction[];
  reply_to_comment_id?: string | null;
  repliedMessage?: {
    content: string;
    senderName: string;
    isDeleted: boolean;
  } | null;
}

export interface Activity {
  id: string;
  type: string;
  user: {
    id: string;
    name: string;
    avatar_url?: string;
    initials?: string;
  };
  details: {
    description: string;
    [key: string]: any;
  };
  timestamp: string;
  project_id?: string;
  project_name?: string;
  project_slug?: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  progress: number;
  budget: number;
  start_date?: string;
  due_date?: string;
  payment_status: string;
  payment_due_date?: string;
  category?: string;
  venue?: string;
  assignedTo: AssignedUser[];
  tasks?: Task[];
  comments?: Comment[];
  activities?: Activity[];
  briefFiles?: ProjectFile[];
  tags?: Tag[];
  services?: string[];
  created_by: User;
  client_name?: string;
  client_avatar_url?: string;
  client_company_logo_url?: string;
  client_company_name?: string;
  invoice_number?: string;
  po_number?: string;
  paid_date?: string;
  email_sending_date?: string;
  hardcopy_sending_date?: string;
  channel?: string;
  client_company_id?: string | null;
  payment_terms?: any[];
  invoice_attachments?: any[];
  public?: boolean;
  active_task_count?: number;
  total_task_count?: number;
  reactions?: Reaction[];
  last_billing_reminder_sent_at?: string;
}

// Goal types
export type GoalType = 'frequency' | 'quantity' | 'value';
export type GoalPeriod = 'Weekly' | 'Monthly';

export interface GoalCompletion {
  id: string;
  date: string;
  value: number;
  notes?: string;
  userId?: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  type: GoalType;
  frequency?: 'Daily' | 'Weekly';
  specific_days?: string[];
  target_quantity?: number;
  target_period?: GoalPeriod;
  target_value?: number;
  unit?: string;
  icon: string;
  icon_url?: string;
  color: string;
  completions: GoalCompletion[];
  tags: Tag[];
  slug: string;
  user_id: string; // Owner ID
  collaborators: User[]; // Collaborators
  created_at?: string;
  reactions?: Reaction[];
}

// People & Company types
export interface CustomProperty {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multi-select' | 'checkbox' | 'url' | 'email' | 'phone' | 'textarea' | 'image';
  options?: string[] | null;
  is_default: boolean;
  category: 'contact' | 'company' | 'project' | 'billing' | 'expense' | 'tag';
}

export interface Person {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  department?: string;
  avatar_url?: string;
  address?: any;
  tags?: Tag[];
  projects?: { id: string; name: string; slug: string; status: string }[];
  social_media?: { linkedin?: string; twitter?: string; instagram?: string; [key: string]: any };
  contact?: { emails: string[]; phones: string[] };
  birthday?: string;
  notes?: string;
  user_id?: string; // Linked auth user
  company_id?: string | null;
  custom_properties?: Record<string, any>;
  updated_at: string;
  slug: string;
  company_logo_url?: string;
}

export interface Company {
  id: string;
  name: string;
  legal_name?: string;
  address?: string;
  logo_url?: string;
  slug?: string;
  created_at?: string;
  updated_at?: string;
  custom_properties?: Record<string, any>;
}

// Invoice
export interface Invoice {
  id: string;
  projectId: string;
  projectName: string;
  amount: number;
  dueDate: Date;
  status: PaymentStatus;
  rawProjectId: string; // UUID
  projectStartDate?: Date | null;
  projectEndDate?: Date | null;
  poNumber?: string | null;
  paidDate?: Date | null;
  emailSendingDate?: Date | null;
  hardcopySendingDate?: Date | null;
  channel?: string | null;
  clientName?: string | null;
  clientAvatarUrl?: string | null;
  clientLogo?: string | null;
  clientCompanyName?: string | null;
  projectOwner?: { id: string; name: string; avatar_url?: string; initials?: string } | null;
  assignedMembers: { id: string; name: string; role?: string; avatar_url?: string; initials?: string }[];
  invoiceAttachments?: any[];
  payment_terms?: any[];
  last_billing_reminder_sent_at?: string | null;
}

export interface Expense {
  id: string;
  project_id: string;
  project_name: string;
  project_slug: string;
  project_owner: { id: string; name: string; avatar_url?: string; initials?: string };
  beneficiary: string;
  tf_amount: number;
  status_expense: string;
  due_date?: string;
  account_bank?: any;
  remarks?: string;
  created_at: string;
  payment_terms?: any[];
  bank_account_id?: string;
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

// Notification
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
    avatar_url?: string;
  };
}

export interface KbArticle {
  id: string;
  title: string;
  slug: string;
  content: any; // JSON or string
  folder_id: string;
  kb_folders: {
    name: string;
    slug: string;
  };
  updated_at: string;
  header_image_url?: string;
  tags?: Tag[];
  creator?: {
    id: string;
    name: string;
    avatar_url?: string;
    initials?: string;
  };
  kb_article_reactions?: ArticleReaction[];
}

export interface KbFolder {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  category?: string;
  updated_at: string;
  access_level?: string;
}

export interface ArticleReaction {
  id: string;
  emoji: string;
  user_id: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
  };
}

export interface PublicationCampaign {
  id: string;
  name: string;
  sheet_url: string;
  updated_at: string;
}

export type Theme = "dark" | "light" | "system" | "claude" | "claude-light" | "nature" | "nature-light" | "corporate" | "corporate-light" | "ahensi" | "ahensi-light" | "brand-activator" | "brand-activator-light";

export interface Collaborator {
  id: string;
  name: string;
  avatar_url?: string | null;
  initials: string;
  email: string;
  isIdle?: boolean;
  last_active_at?: string;
}

export interface Conversation {
  id: string;
  userName: string;
  userAvatar?: string;
  isGroup: boolean;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  members: Collaborator[];
  messages: Message[];
  created_by?: string;
}

export interface ChatMessageAttachment {
  name: string;
  url: string;
  type: string;
}

export interface Message {
  id: string;
  text: string;
  sender: User;
  timestamp: string;
  attachment?: ChatMessageAttachment;
  reply_to_message_id?: string | null;
  repliedMessage?: {
    content: string;
    senderName: string;
    isDeleted: boolean;
    attachment?: ChatMessageAttachment | null;
  } | null;
  reactions?: Reaction[];
  is_deleted?: boolean;
  is_forwarded?: boolean;
  updated_at?: string;
}

export type ConversationMessage = {
  sender: 'ai' | 'user';
  content: string;
};

export interface ProjectStatusDef {
  id: string;
  name: string;
  color: string;
  position: number;
}

export type UpsertTaskPayload = {
  id?: string;
  project_id?: string | null;
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

export interface AdvancedFiltersState {
  ownerIds: string[];
  memberIds: string[];
  excludedStatus: string[];
}