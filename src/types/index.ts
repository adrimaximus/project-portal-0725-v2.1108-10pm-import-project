export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  initials?: string;
  first_name?: string | null;
  last_name?: string | null;
  role?: string;
  status?: string;
  updated_at?: string;
  permissions?: string[];
  people_kanban_settings?: any;
  theme?: string;
}

export interface Collaborator extends User {}

export interface Attachment {
  name: string;
  url: string;
  type: string;
}

export interface Reaction {
  emoji: string;
  user_id: string;
  user_name: string;
}

export interface RepliedMessage {
  senderName: string;
  content: string;
  isDeleted: boolean;
}

export interface Message {
  id: string;
  text?: string | null;
  timestamp: string;
  sender: User;
  attachment?: Attachment;
  reply_to_message_id?: string | null;
  repliedMessage?: RepliedMessage;
  reactions?: Reaction[];
  is_deleted?: boolean;
  is_forwarded?: boolean;
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  userName: string;
  userAvatar?: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  members: Collaborator[];
  messages: Message[];
  created_by: string;
}

export const PROJECT_STATUS_OPTIONS = [
  { value: 'On Track', label: 'On Track' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'In Review', label: 'In Review' },
  { value: 'Completed', label: 'Completed' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'At Risk', label: 'At Risk' },
  { value: 'Off Track', label: 'Off Track' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Requested', label: 'Requested' },
  { value: 'Idea', label: 'Idea' },
] as const;

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'Paid', label: 'Paid' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'Due', label: 'Due' },
  { value: 'Unpaid', label: 'Unpaid' },
  { value: 'Pending', label: 'Pending' },
  { value: 'In Process', label: 'In Process' },
  { value: 'Proposed', label: 'Proposed' },
  { value: 'Cancelled', label: 'Cancelled' },
] as const;

export type ProjectStatus = typeof PROJECT_STATUS_OPTIONS[number]['value'];
export type PaymentStatus = typeof PAYMENT_STATUS_OPTIONS[number]['value'];

export interface Tag {
  id: string;
  name: string;
  color: string;
  isNew?: boolean;
  user_id?: string;
  type?: string;
}

export interface AssignedUser extends User {
  role: 'owner' | 'admin' | 'editor' | 'member';
}

export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
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

export type TaskStatus = 'To do' | 'In Progress' | 'In Review' | 'Done' | 'Cancelled';

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'To do', label: 'To do' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'In Review', label: 'In Review' },
  { value: 'Done', label: 'Done' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export type TaskPriority = 'Urgent' | 'High' | 'Normal' | 'Low';

export const TASK_PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'Urgent', label: 'Urgent' },
  { value: 'High', label: 'High' },
  { value: 'Normal', label: 'Normal' },
  { value: 'Low', label: 'Low' },
];

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  originTicketId?: string | null;
  assignedTo?: User[];
  attachments?: TaskAttachment[];
  createdBy?: User;
  created_by?: any;
  project_id: string;
  project_name?: string;
  project_slug?: string;
  project_status?: string;
  description?: string | null;
  due_date?: string | null;
  priority?: string | null;
  status: TaskStatus;
  tags?: Tag[];
  updated_at?: string;
  created_at: string;
  origin_ticket_id?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  project_venue?: string | null;
  project_owner?: any;
  project_client?: string | null;
}

export interface Comment {
  id: string;
  text: string;
  timestamp: string;
  author: User;
  isTicket: boolean;
  attachment_url?: string | null;
  attachment_name?: string | null;
}

export interface Activity {
  id: string;
  type: string;
  details: {
    description: string;
  };
  timestamp: string;
  user: User | null;
}

export interface Person {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
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
  avatar_url?: string | null;
  address?: {
    formatted_address?: string;
    name?: string;
  } | null;
  projects?: { id: string; name: string; slug: string }[];
  tags?: Tag[];
  updated_at: string;
  contact?: {
    emails?: string[];
    phones?: string[];
  } | null;
  custom_properties?: Record<string, any> | null;
  user_id?: string | null;
  slug: string;
  kanban_order?: number;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  start_date: string;
  due_date: string;
  payment_status: PaymentStatus;
  payment_due_date: string;
  created_by: User;
  assignedTo: AssignedUser[];
  tasks: Task[];
  comments: Comment[];
  briefFiles: ProjectFile[];
  activities: Activity[];
  services: string[];
  tags: Tag[];
  people?: Person[];
  person_ids?: string[];
  invoice_number?: string | null;
  po_number?: string | null;
  paid_date?: string | null;
  email_sending_date?: string | null;
  hardcopy_sending_date?: string | null;
  channel?: string | null;
  venue?: string | null;
  invoice_attachments?: InvoiceAttachment[];
  kanban_order?: number;
  payment_kanban_order?: number;
  origin_event_id?: string | null;
  client_name?: string | null;
  client_avatar_url?: string | null;
  client_company_logo_url?: string | null;
  client_company_name?: string | null;
  client_company_custom_properties?: any;
  client_company_id?: string | null;
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

export interface Owner extends User {}
export interface Member extends User {
  role: string;
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
}

export type GoalType = 'frequency' | 'quantity' | 'value';
export type GoalPeriod = 'Weekly' | 'Monthly';

export interface GoalCompletion {
  id: string;
  date: string;
  value: number;
  notes?: string;
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
  collaborators: Collaborator[];
  completions: GoalCompletion[];
}

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

export type FolderAccessLevel = 'private' | 'public_view' | 'public_edit';

export interface KbArticle {
  id: string;
  folder_id: string;
  user_id: string;
  title: string;
  content: any;
  slug: string;
  created_at: string;
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
    avatar_url: string;
    initials: string;
  };
}

export interface ContactProperty {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'email' | 'phone' | 'url' | 'image' | 'select' | 'multi-select' | 'checkbox';
  is_default: boolean;
  options?: string[] | null;
}

export interface CompanyProperty {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'email' | 'phone' | 'url' | 'image' | 'select';
  options?: string[] | null;
  is_default: boolean;
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

export type NotificationType = 'comment' | 'mention' | 'project' | 'project_update' | 'system' | 'goal';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  link?: string;
  actor?: {
    id: string;
    name: string;
    avatar: string;
  };
}

export type Theme = "light" | "dark" | "system" | "claude" | "claude-light" | "nature" | "nature-light" | "corporate" | "corporate-light" | "ahensi" | "ahensi-light" | "brand-activator" | "brand-activator-light";