export const PROJECT_STATUS_OPTIONS = [
  { value: 'Requested', label: 'Requested' },
  { value: 'On Track', label: 'On Track' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Bid Lost', label: 'Bid Lost' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Reschedule', label: 'Reschedule' },
  { value: 'Billing Process', label: 'Billing Process' },
  { value: 'Archived', label: 'Archived' },
] as const;

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'Proposed', label: 'Proposed' },
  { value: 'Invoiced', label: 'Invoiced' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Partially Paid', label: 'Partially Paid' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'Pending', label: 'Pending' },
  { value: 'In Process', label: 'In Process' },
  { value: 'Requested', label: 'Requested' },
  { value: 'Quo Approved', label: 'Quo Approved' },
  { value: 'Inv Approved', label: 'Inv Approved' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Bid Lost', label: 'Bid Lost' },
] as const;

export const TASK_STATUS_OPTIONS = [
  { value: 'To do', label: 'To do' },
  { value: 'In progress', label: 'In progress' },
  { value: 'Done', label: 'Done' },
] as const;

export const TASK_PRIORITY_OPTIONS = [
  { value: 'Urgent', label: 'Urgent' },
  { value: 'High', label: 'High' },
  { value: 'Normal', label: 'Normal' },
  { value: 'Low', label: 'Low' },
] as const;

export type ProjectStatus = typeof PROJECT_STATUS_OPTIONS[number]['value'];
export type PaymentStatus = typeof PAYMENT_STATUS_OPTIONS[number]['value'];
export type TaskStatus = typeof TASK_STATUS_OPTIONS[number]['value'];
export type TaskPriority = typeof TASK_PRIORITY_OPTIONS[number]['value'];

export const CUSTOM_PROPERTY_TYPES = [
  "text",
  "textarea",
  "number",
  "date",
  "email",
  "phone",
  "url",
  "image",
  "multi-image",
  "select",
  "multi-select",
  "checkbox",
] as const;

export type CustomPropertyType = (typeof CUSTOM_PROPERTY_TYPES)[number];

export type CustomProperty = {
  id: string;
  name: string;
  label: string;
  type: CustomPropertyType;
  options?: string[] | null;
  category: 'company' | 'contact' | 'tag';
  is_default: boolean;
};

export type Theme = "light" | "dark" | "system" | "claude" | "claude-light" | "nature" | "nature-light" | "corporate" | "corporate-light" | "ahensi" | "ahensi-light" | "brand-activator" | "brand-activator-light";

export type User = {
  id: string;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  permissions?: string[];
  status?: string;
  initials: string;
  updated_at?: string;
  theme?: string;
  people_kanban_settings?: any;
  notification_preferences?: any;
  sidebar_order?: any;
  phone?: string | null;
};

export type Collaborator = User & {
  isIdle?: boolean;
  last_active_at?: string;
};

export type AssignedUser = User & {
  role: string;
  initials: string;
};

export type Owner = {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  initials: string;
};

export type Person = {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  company_id?: string | null;
  job_title?: string | null;
  avatar_url?: string | null;
  slug?: string;
  address?: any;
  contact?: { emails?: string[], phones?: string[] };
  department?: string | null;
  birthday?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  projects?: { id: string, name: string, slug: string, status: ProjectStatus }[];
  tags?: Tag[];
  user_id?: string | null;
  custom_properties?: Record<string, any> | null;
  social_media?: { [key: string]: string };
  kanban_order?: number;
};

export type Company = {
  id: string;
  name: string;
  legal_name?: string | null;
  address?: string | null;
  logo_url?: string | null;
  custom_properties?: Record<string, any> | null;
  updated_at?: string;
};

export type Reaction = {
  id: string;
  emoji: string;
  user_id: string;
  user_name: string;
};

export type Comment = {
  id: string;
  created_at: string;
  text: string;
  is_ticket: boolean;
  author: User;
  author_id: string;
  project_id: string;
  task_id: string;
  reactions?: Reaction[];
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachments_jsonb?: any[];
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

export type Tag = {
  id: string;
  name: string;
  color: string;
  user_id: string;
  type?: string;
  custom_properties?: Record<string, any> | null;
  isNew?: boolean;
};

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  due_date?: string | null;
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
  origin_ticket_id?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachments?: TaskAttachment[];
  ticket_attachments?: TaskAttachment[];
  reactions: Reaction[];
  last_reminder_sent_at?: string | null;
  kanban_order?: number;
};

export type ProjectFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  storage_path: string;
  created_at: string;
};

export type Activity = {
  id: string;
  type: string;
  details: {
    description: string;
  };
  timestamp: string;
  user: User;
};

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  budget?: number | null;
  start_date?: string | null;
  due_date?: string | null;
  payment_status: PaymentStatus;
  payment_due_date?: string | null;
  venue?: string | null;
  services?: string[];
  people?: Person[];
  person_ids?: string[];
  client_company_id?: string | null;
  tasks?: Task[];
  comments?: Comment[];
  slug: string;
  created_at: string;
  updated_at: string;
  created_by: Owner;
  assignedTo: AssignedUser[];
  briefFiles: ProjectFile[];
  activities: Activity[];
  tags: Tag[];
  progress: number;
  invoice_number?: string | null;
  po_number?: string | null;
  paid_date?: string | null;
  email_sending_date?: string | null;
  hardcopy_sending_date?: string | null;
  channel?: string | null;
  client_name?: string | null;
  client_avatar_url?: string | null;
  client_company_logo_url?: string | null;
  client_company_name?: string | null;
  personal_for_user_id?: string | null;
  reactions: Reaction[];
  invoice_attachments?: InvoiceAttachment[];
  payment_terms?: { amount: number; date: string }[];
  category?: string | null;
  origin_event_id?: string | null;
};

export type UpsertTaskPayload = {
  id?: string;
  project_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  completed?: boolean;
  assignee_ids?: string[];
  tag_ids?: string[];
  new_files?: File[];
  deleted_files?: string[];
};

export type GoalType = 'frequency' | 'quantity' | 'value';
export type GoalPeriod = 'Weekly' | 'Monthly';

export type GoalCompletion = {
  id: string;
  date: string;
  value: number;
  notes?: string;
  userId: string;
};

export type Goal = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  icon: string;
  icon_url?: string | null;
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
  collaborators: Collaborator[];
  completions: GoalCompletion[];
  reactions: Reaction[];
};

export type Service = {
  id: string;
  title: string;
  description: string;
  icon: string;
  icon_color: string;
  is_featured: boolean;
};

export type AppNotification = {
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
};

export type KbFolder = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  slug: string;
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
  kb_folders: { name: string; slug: string };
  tags: Tag[];
  creator: {
    id: string;
    name: string;
    avatar_url: string;
    initials: string;
  };
  kb_article_reactions: ArticleReaction[];
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

export type Invoice = {
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
  payment_terms: { amount: number; date: string }[];
};

export type Member = {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  initials: string;
  role: string;
};

export type InvoiceAttachment = {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
};

export type ChatMessageAttachment = {
  name: string;
  url: string;
  type: string;
};

export type Message = {
  id: string;
  text: string;
  timestamp: string;
  sender: User;
  attachment?: ChatMessageAttachment;
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

export type ConversationMessage = {
  sender: 'ai' | 'user';
  content: string;
};