import { Database } from './supabase';

export type Project = Database['public']['Functions']['get_dashboard_projects']['Returns'][0];

export type ProjectStatus = "Requested" | "On Hold" | "Reschedule" | "In Progress" | "Billing Process" | "Completed" | "Cancelled" | "Bid Lost" | "Archived";

export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
    { value: 'Requested', label: 'Requested' },
    { value: 'On Hold', label: 'On Hold' },
    { value: 'Reschedule', label: 'Reschedule' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Billing Process', label: 'Billing Process' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'Bid Lost', label: 'Bid Lost' },
    { value: 'Archived', label: 'Archived' },
];

export type PaymentStatus =
  | 'Requested'
  | 'Proposed'
  | 'Quo Approved'
  | 'Inv Approved'
  | 'In Process'
  | 'Pending'
  | 'Overdue'
  | 'Partially Paid'
  | 'Paid'
  | 'Cancelled'
  | 'Bid Lost'
  | 'Unpaid';

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'Requested', label: 'Requested' },
  { value: 'Proposed', label: 'Proposed' },
  { value: 'Quo Approved', label: 'Quo Approved' },
  { value: 'Inv Approved', label: 'Inv Approved' },
  { value: 'Pending', label: 'Pending' },
  { value: 'In Process', label: 'In Process' },
  { value: 'Partially Paid', label: 'Partially Paid' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'Unpaid', label: 'Unpaid' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Bid Lost', label: 'Bid Lost' },
];

export type TaskStatus = 'To do' | 'In Progress' | 'Done' | 'Blocked';

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
    { value: 'To do', label: 'To do' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Done', label: 'Done' },
    { value: 'Blocked', label: 'Blocked' },
];

export type TaskPriority = 'Urgent' | 'High' | 'Medium' | 'Normal' | 'Low';

export const TASK_PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
    { value: 'Urgent', label: 'Urgent' },
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Normal', label: 'Normal' },
    { value: 'Low', label: 'Low' },
];

export type Invoice = {
  id: string;
  projectId: string;
  rawProjectId: string;
  projectName: string;
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
  invoiceAttachments: Attachment[];
  payment_terms: any[];
};

export type Member = {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  initials: string;
  role: string;
};

export type Owner = {
  id: string;
  name: string;
  avatar_url: string;
  initials: string;
};

export type Attachment = {
  id: string;
  file_name: string;
  file_url: string;
  storage_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
};

export const CONTACT_PROPERTY_TYPES = [
  'text', 'textarea', 'number', 'date', 'email', 'phone', 'url', 'image', 'multi-image', 'select', 'multi-select', 'checkbox'
] as const;

export type ContactProperty = {
  id: string;
  name: string;
  label: string;
  type: (typeof CONTACT_PROPERTY_TYPES)[number];
  options?: string[] | null;
  is_default?: boolean;
};

export const COMPANY_PROPERTY_TYPES = [
  'text', 'textarea', 'number', 'date', 'email', 'phone', 'url', 'image', 'select'
] as const;

export type CompanyProperty = {
  id: string;
  name: string;
  label: string;
  type: (typeof COMPANY_PROPERTY_TYPES)[number];
  options?: string[] | null;
  is_default?: boolean;
};

export type Company = {
  id: string;
  name: string;
  legal_name?: string | null;
  address?: string | null;
  billing_address?: string | null;
  logo_url?: string | null;
  created_at?: string;
  updated_at?: string;
  user_id?: string | null;
  custom_properties?: Record<string, any> | null;
};

export type Person = {
  id: string;
  full_name: string;
  contact?: {
    emails?: string[];
    phones?: string[];
  } | null;
  company?: string | null;
  job_title?: string | null;
  department?: string | null;
  social_media?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  } | null;
  birthday?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  projects?: { id: string; name: string; slug: string }[] | null;
  tags?: Tag[] | null;
  avatar_url?: string | null;
  user_id?: string | null;
  address?: any;
  email?: string | null;
  phone?: string | null;
  company_id?: string | null;
  slug?: string;
  kanban_order?: number;
  custom_properties?: Record<string, any> | null;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
  user_id?: string | null;
  isNew?: boolean;
  type?: string;
  lead_time?: number | null;
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
  updated_at?: string;
  phone?: string | null;
  permissions?: string[];
  people_kanban_settings?: any;
  theme?: string;
};

export type Collaborator = User;

export type Reaction = {
  id: string;
  emoji: string;
  user_id: string;
  user_name: string;
  profiles?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  }
};

export type TaskAttachment = {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  created_at: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  due_date: string | null;
  priority: TaskPriority | null;
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
  originTicketId?: string | null;
  origin_ticket_id?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachments: TaskAttachment[];
  ticket_attachments?: TaskAttachment[];
  project_venue: string | null;
  project_owner: User | null;
  project_client: string | null;
  reactions: Reaction[];
  kanban_order: number | null;
  last_reminder_sent_at?: string | null;
};

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
};

export type Theme = "light" | "dark" | "system" | "claude" | "claude-light" | "nature" | "nature-light" | "corporate" | "corporate-light" | "ahensi" | "ahensi-light" | "brand-activator" | "brand-activator-light";

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  link?: string;
  actor: {
    id: string;
    name: string;
    avatar_url: string;
  };
};

export type ConversationMessage = {
  sender: 'user' | 'ai';
  content: string;
};

export type Message = {
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
};

export type Conversation = {
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
};

export type KbFolder = {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  icon: string | null;
  color: string | null;
  category: string | null;
  access_level: FolderAccessLevel;
  updated_at: string;
};

export type FolderAccessLevel = 'private' | 'public_view' | 'public_edit';

export type KbArticle = {
  id: string;
  title: string;
  slug: string;
  content: any;
  folder_id: string;
  updated_at: string;
  header_image_url: string | null;
  kb_folders: {
    name: string;
    slug: string;
  };
  tags: Tag[];
  kb_article_reactions: ArticleReaction[];
  creator: {
    id: string;
    name: string;
    avatar_url: string;
    initials: string;
  };
};

export type ArticleReaction = {
  id: string;
  emoji: string;
  user_id: string;
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
};

export type GoalType = 'frequency' | 'quantity' | 'value';
export type GoalPeriod = 'Weekly' | 'Monthly';

export type Goal = {
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
  frequency: 'Daily' | 'Weekly' | null;
  target_period: GoalPeriod | null;
  unit: string | null;
  specific_days: string[] | null;
  created_at: string;
  updated_at: string;
  slug: string;
  tags: Tag[];
  collaborators: Collaborator[];
  completions: GoalCompletion[];
  reactions: Reaction[];
};

export type GoalCompletion = {
  id: string;
  date: string;
  value: number;
  notes: string | null;
  userId: string;
};

export type Service = {
  id: string;
  title: string;
  description: string;
  icon: string;
  icon_color: string;
  is_featured: boolean;
};