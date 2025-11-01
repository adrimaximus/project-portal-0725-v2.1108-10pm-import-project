import { User as SupabaseUser } from '@supabase/supabase-js';

// Base User & Profile
export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  initials?: string;
  role?: string;
  status?: string;
  updated_at?: string;
  phone?: string | null;
  people_kanban_settings?: any;
  theme?: string;
  permissions?: string[];
}

export interface Profile extends User {
  role: string;
  status: string;
  permissions: string[];
}

export interface AppUser extends SupabaseUser {
  profile: Profile;
}

// Collaborators & Owners
export interface Collaborator extends User {
  isIdle?: boolean;
  last_active_at?: string;
}
export interface AssignedUser extends User {
  role: 'owner' | 'admin' | 'member' | 'editor';
}
export type Owner = User;
export type Member = User & { role: 'owner' | 'admin' | 'member' | 'editor' };

// Tags
export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id?: string | null;
  isNew?: boolean;
  type?: string;
  lead_time?: number | null;
}

// Reactions
export interface Reaction {
  id: string;
  emoji: string;
  user_id: string;
  user_name: string;
}

// Attachments & Files
export interface Attachment {
  name: string;
  url: string;
  type: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string | null;
  url: string;
  storage_path: string;
  created_at: string;
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

// Comments
export interface Comment {
  id: string;
  text: string | null;
  created_at: string;
  isTicket: boolean;
  author: User;
  reactions?: Reaction[];
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachments_jsonb?: any[];
  task_id?: string | null;
}

// Tasks
export type TaskStatus = 'To do' | 'In progress' | 'In review' | 'Done';
export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'To do', label: 'To do' },
  { value: 'In progress', label: 'In Progress' },
  { value: 'In review', label: 'In Review' },
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
  originTicketId: string | null; // Mapped from origin_ticket_id
  origin_ticket_id?: string | null; // From DB
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachments: TaskAttachment[];
  project_venue: string | null;
  project_owner: User;
  project_client: string | null;
  reactions: Reaction[];
  kanban_order: number;
  ticket_attachments?: TaskAttachment[];
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
}

// Projects
export type ProjectStatus = 'On Track' | 'At Risk' | 'Off Track' | 'On Hold' | 'Completed' | 'Archived' | 'New' | 'In Progress' | 'Pending' | 'Cancelled' | 'Bid Lost';
export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'On Track', label: 'On Track' },
  { value: 'At Risk', label: 'At Risk' },
  { value: 'Off Track', label: 'Off Track' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Archived', label: 'Archived' },
  { value: 'New', label: 'New' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Bid Lost', label: 'Bid Lost' },
];

export interface Project {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  category: string | null;
  description: string | null;
  status: ProjectStatus;
  progress: number;
  budget: number | null;
  start_date: string | null;
  due_date: string | null;
  payment_status: PaymentStatus;
  created_by: Owner;
  origin_event_id: string | null;
  payment_due_date: string | null;
  slug: string;
  public: boolean;
  venue: string | null;
  kanban_order: number;
  payment_kanban_order: number;
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
  payment_terms: any[] | null;
  assignedTo: Member[];
  tasks: Task[];
  comments: Comment[];
  briefFiles: ProjectFile[];
  activities: Activity[];
  tags: Tag[];
  client_name: string | null;
  client_avatar_url: string | null;
  client_company_logo_url: string | null;
  client_company_name: string | null;
  client_company_custom_properties: any;
  reactions: Reaction[];
  invoice_attachments?: InvoiceAttachment[];
  people?: Person[];
  person_ids?: string[];
}

// Billing & Invoices
export type PaymentStatus = 'Paid' | 'Overdue' | 'Due' | 'Unpaid' | 'Pending' | 'In Process' | 'Proposed' | 'Cancelled' | 'Bid Lost';
export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
    { value: 'Paid', label: 'Paid' },
    { value: 'Overdue', label: 'Overdue' },
    { value: 'Due', label: 'Due' },
    { value: 'Unpaid', label: 'Unpaid' },
    { value: 'Pending', label: 'Pending' },
    { value: 'In Process', label: 'In Process' },
    { value: 'Proposed', label: 'Proposed' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'Bid Lost', label: 'Bid Lost' },
];

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
  assignedMembers: Member[];
  invoiceAttachments: InvoiceAttachment[];
  payment_terms: any[] | null;
}

// People & Companies
export interface Person {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  department: string | null;
  social_media: { [key: string]: string } | null;
  birthday: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  projects: { id: string; name: string; slug: string; status: string; }[];
  tags: Tag[];
  avatar_url: string | null;
  user_id: string | null;
  address: { name?: string; address?: string; formatted_address?: string } | string | null;
  contact: { emails?: string[]; phones?: string[] } | null;
  company_id?: string | null;
  slug: string;
  kanban_order?: number;
  custom_properties?: Record<string, any>;
}

export interface Company {
  id: string;
  name: string;
  legal_name: string | null;
  address: string | null;
  billing_address: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  custom_properties: Record<string, any> | null;
}

export const CONTACT_PROPERTY_TYPES = [
  'text', 'textarea', 'number', 'date', 'email', 'phone', 'url', 'image', 'multi-image', 'select', 'multi-select', 'checkbox'
] as const;

export interface ContactProperty {
  id: string;
  name: string;
  label: string;
  type: typeof CONTACT_PROPERTY_TYPES[number];
  options: string[] | null;
  is_default: boolean;
}

export const COMPANY_PROPERTY_TYPES = [
  'text', 'textarea', 'number', 'date', 'email', 'phone', 'url', 'image', 'select'
] as const;

export interface CompanyProperty {
  id: string;
  name: string;
  label: string;
  type: typeof COMPANY_PROPERTY_TYPES[number];
  options: string[] | null;
  is_default: boolean;
}

// Activity
export interface Activity {
  id: string;
  type: string;
  details: {
    description: string;
  };
  timestamp: string;
  user: User | null;
}

// Goals
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
  frequency: 'Daily' | 'Weekly' | 'Monthly';
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

// Chat
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
    avatar_url: string;
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

// Theme
export type Theme = "light" | "dark" | "system" | "claude" | "claude-light" | "nature" | "nature-light" | "corporate" | "corporate-light" | "ahensi" | "ahensi-light" | "brand-activator" | "brand-activator-light";