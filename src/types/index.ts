// User & Auth
export interface User {
  id: string;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  role?: string;
  status?: string;
  initials?: string;
  updated_at?: string;
  permissions?: string[];
  people_kanban_settings?: any;
  theme?: string;
  phone?: string | null;
}

export type Collaborator = {
  id: string;
  name: string;
  avatar_url?: string | null;
  initials?: string;
  isIdle?: boolean;
  last_active_at?: string | null;
  email?: string;
};

// Projects
export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  category: string;
  progress: number;
  budget: number;
  start_date: string;
  due_date: string;
  payment_status: string;
  payment_due_date: string;
  origin_event_id: string;
  venue: string;
  created_by: User;
  assignedTo: AssignedUser[];
  tasks: Task[];
  comments: Comment[];
  services: string[];
  briefFiles: ProjectFile[];
  activities: Activity[];
  tags: Tag[];
  client_name?: string;
  client_avatar_url?: string;
  client_company_logo_url?: string;
  client_company_name?: string;
  client_company_custom_properties?: any;
  client_company_id?: string | null;
  reactions: Reaction[];
  public: boolean;
  people?: Person[];
  person_ids?: string[];
  invoice_number?: string;
  po_number?: string;
  paid_date?: string;
  email_sending_date?: string;
  hardcopy_sending_date?: string;
  channel?: string;
  invoice_attachments?: InvoiceAttachment[];
  payment_terms: any[];
  personal_for_user_id?: string;
  created_at: string;
  updated_at: string;
}

export type ProjectStatus = 'Idea' | 'Requested' | 'On Track' | 'In Progress' | 'In Review' | 'On Hold' | 'At Risk' | 'Off Track' | 'Completed' | 'Cancelled' | 'Bid Lost';
export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'Idea', label: 'Idea' },
  { value: 'Requested', label: 'Requested' },
  { value: 'On Track', label: 'On Track' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'In Review', label: 'In Review' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'At Risk', label: 'At Risk' },
  { value: 'Off Track', label: 'Off Track' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Bid Lost', label: 'Bid Lost' },
];

export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  storage_path: string;
  created_at: string;
}

// Tasks
export type TaskStatus = 'To do' | 'In Progress' | 'Done' | 'Cancelled';
export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'To do', label: 'To do' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Done', label: 'Done' },
  { value: 'Cancelled', label: 'Cancelled' },
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
  tags: Tag[];
  originTicketId?: string;
  origin_ticket_id?: string;
  attachment_url?: string;
  attachment_name?: string;
  attachments?: TaskAttachment[];
  ticket_attachments?: TaskAttachment[];
  reactions: Reaction[];
  kanban_order?: number;
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

export interface UpsertTaskPayload {
  id?: string;
  project_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority?: string | null;
  status?: string;
  completed?: boolean;
  assignee_ids?: string[];
  tag_ids?: string[];
  new_files?: File[];
  deleted_files?: string[];
}

// People & Companies
export interface Person {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  company_id?: string | null;
  job_title?: string | null;
  department?: string | null;
  social_media?: { [key: string]: string };
  birthday?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  projects?: Project[];
  tags?: Tag[];
  avatar_url?: string | null;
  user_id?: string | null;
  address?: any;
  contact?: { emails?: string[], phones?: string[] };
  slug?: string;
  kanban_order?: number;
  custom_properties?: Record<string, any>;
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
  custom_properties?: Record<string, any>;
}

export const CONTACT_PROPERTY_TYPES = [
  'text', 'textarea', 'number', 'date', 'email', 'phone', 'url', 'image', 'multi-image', 'select', 'multi-select', 'checkbox'
] as const;

export interface ContactProperty {
  id: string;
  name: string;
  label: string;
  type: typeof CONTACT_PROPERTY_TYPES[number];
  is_default: boolean;
  options?: string[];
}

export const COMPANY_PROPERTY_TYPES = [
  'text', 'textarea', 'number', 'date', 'email', 'phone', 'url', 'image', 'select'
] as const;

export interface CompanyProperty {
  id: string;
  name: string;
  label: string;
  type: typeof COMPANY_PROPERTY_TYPES[number];
  options?: any;
  is_default?: boolean;
}

// Billing
export type PaymentStatus = 'Proposed' | 'Unpaid' | 'Due' | 'Overdue' | 'In Process' | 'Paid' | 'Cancelled';
export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'Proposed', label: 'Proposed' },
  { value: 'Unpaid', label: 'Unpaid' },
  { value: 'Due', label: 'Due' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'In Process', label: 'In Process' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export interface Invoice {
  id: string;
  projectId: string;
  projectName: string;
  rawProjectId: string;
  amount: number;
  dueDate: Date;
  status: PaymentStatus;
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

export type Member = {
  id: string;
  name: string;
  role: string;
  avatar_url?: string | null;
  initials?: string;
};

export type Owner = {
  id: string;
  name: string;
  avatar_url?: string | null;
  initials?: string;
};

// Chat & Comments
export interface Message {
  id: string;
  text: string;
  timestamp: string;
  sender: User;
  attachment?: Attachment;
  reply_to_message_id?: string | null;
  repliedMessage?: {
    content: string;
    senderName: string;
    isDeleted: boolean;
  } | null;
  reactions?: Reaction[];
  is_deleted?: boolean;
  is_forwarded?: boolean;
}

export interface Attachment {
  name: string;
  url: string;
  type: string;
}

export interface Comment {
  id: string;
  text: string;
  created_at: string;
  author: User;
  isTicket: boolean;
  attachment_url?: string;
  attachment_name?: string;
  attachments_jsonb?: any[];
  reactions?: Reaction[];
}

export interface Reaction {
  id: string;
  emoji: string;
  user_id: string;
  user_name: string;
}

export interface Conversation {
  id: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  messages: Message[];
  isGroup: boolean;
  members: Collaborator[];
  created_by: string;
}

// Goals
export type GoalType = 'frequency' | 'quantity' | 'value';
export type GoalPeriod = 'Weekly' | 'Monthly';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  icon: string;
  icon_url?: string;
  color: string;
  type: GoalType;
  target_quantity?: number;
  target_value?: number;
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  target_period?: GoalPeriod;
  unit?: string;
  specific_days?: string[];
  created_at: string;
  updated_at: string;
  slug: string;
  tags: Tag[];
  collaborators: User[];
  completions: GoalCompletion[];
  reactions: Reaction[];
}

export interface GoalCompletion {
  id: string;
  date: string;
  value: number;
  notes?: string;
  userId: string;
}

// Knowledge Base
export interface KbFolder {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  access_level: FolderAccessLevel;
  slug: string;
  updated_at: string;
}

export type FolderAccessLevel = 'private' | 'public_view' | 'public_edit';

export interface KbArticle {
  id: string;
  title: string;
  slug: string;
  content: any;
  folder_id: string;
  updated_at: string;
  header_image_url: string;
  kb_folders: { name: string, slug: string };
  tags: Tag[];
  creator: User;
  kb_article_reactions: any[];
}

// General
export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id?: string;
  isNew?: boolean;
  type?: string;
  lead_time?: number | null;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  icon_color: string;
  is_featured: boolean;
}

export type AssignedUser = User & { role: string };

export interface Activity {
  id: string;
  type: string;
  details: { description: string };
  timestamp: string;
  user: User;
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

export type Theme = "light" | "dark" | "system" | "claude" | "claude-light" | "nature" | "nature-light" | "corporate" | "corporate-light" | "ahensi" | "ahensi-light" | "brand-activator" | "brand-activator-light";

export type ConversationMessage = {
  sender: 'user' | 'ai';
  content: string;
};