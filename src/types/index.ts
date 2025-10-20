export type ProjectStatus = 'On Track' | 'At Risk' | 'Off Track' | 'On Hold' | 'Completed' | 'Cancelled' | 'In Progress' | 'In Review' | 'Requested' | 'Idea';
export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus, label: string }[] = [
    { value: 'On Track', label: 'On Track' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'In Review', label: 'In Review' },
    { value: 'At Risk', label: 'At Risk' },
    { value: 'Off Track', label: 'Off Track' },
    { value: 'On Hold', label: 'On Hold' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'Requested', label: 'Requested' },
    { value: 'Idea', label: 'Idea' },
];

export type PaymentStatus = 'Paid' | 'Unpaid' | 'Overdue' | 'Pending' | 'In Process' | 'Proposed' | 'Cancelled' | 'Due';
export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus, label: string }[] = [
    { value: 'Paid', label: 'Paid' },
    { value: 'Unpaid', label: 'Unpaid' },
    { value: 'Overdue', label: 'Overdue' },
    { value: 'Pending', label: 'Pending' },
    { value: 'In Process', label: 'In Process' },
    { value: 'Proposed', label: 'Proposed' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'Due', label: 'Due' },
];

export type TaskStatus = 'To do' | 'In Progress' | 'Done' | 'Cancelled';
export const TASK_STATUS_OPTIONS: { value: TaskStatus, label: string }[] = [
    { value: 'To do', label: 'To do' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Done', label: 'Done' },
    { value: 'Cancelled', label: 'Cancelled' },
];

export type TaskPriority = 'Urgent' | 'High' | 'Normal' | 'Low';
export const TASK_PRIORITY_OPTIONS: { value: TaskPriority, label: string }[] = [
    { value: 'Urgent', label: 'Urgent' },
    { value: 'High', label: 'High' },
    { value: 'Normal', label: 'Normal' },
    { value: 'Low', label: 'Low' },
];

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  initials: string;
  role?: string;
  status?: string;
  updated_at?: string;
  first_name?: string | null;
  last_name?: string | null;
  permissions?: string[];
  people_kanban_settings?: any;
  theme?: string;
  phone?: string | null;
}

export interface Collaborator {
  id: string;
  name: string;
  avatar_url?: string;
  initials: string;
  online?: boolean;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
}

export interface AssignedUser extends User {
  role: 'owner' | 'admin' | 'editor' | 'member';
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  isNew?: boolean;
  user_id?: string | null;
  type?: string;
}

export interface TaskAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number;
  storage_path: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  project_id: string;
  project_name?: string;
  project_slug?: string;
  originTicketId?: string | null;
  assignedTo: User[];
  created_by: User;
  description?: string | null;
  due_date?: string | null;
  priority?: TaskPriority;
  status: TaskStatus;
  tags?: Tag[];
  created_at: string;
  updated_at: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachments?: TaskAttachment[];
  project_venue?: string | null;
  project_owner?: { id: string; name: string };
  project_client?: string | null;
  reactions?: Reaction[];
  kanban_order?: number;
  origin_ticket_id?: string | null;
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

export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  storage_path: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
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
  services: string[];
  briefFiles: ProjectFile[];
  activities: Activity[];
  tags: Tag[];
  category: string;
  venue: string | null;
  client_name?: string | null;
  client_avatar_url?: string | null;
  client_company_logo_url?: string | null;
  client_company_name?: string | null;
  client_company_custom_properties?: any;
  invoice_number?: string | null;
  po_number?: string | null;
  paid_date?: string | null;
  email_sending_date?: string | null;
  hardcopy_sending_date?: string | null;
  channel?: string | null;
  invoice_attachments?: InvoiceAttachment[];
  people?: Person[];
  person_ids?: string[];
  client_company_id?: string | null;
  kanban_order?: number;
  payment_kanban_order?: number;
}

export interface Attachment {
  name: string;
  url: string;
  type: string;
}

export interface Reaction {
  id?: string;
  emoji: string;
  user_id: string;
  user_name: string;
}

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
  isGroup: boolean;
  members: Collaborator[];
  messages: Message[];
  created_by: string;
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
  invoiceAttachments?: InvoiceAttachment[];
}

export interface InvoiceAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number;
  storage_path: string;
  created_at: string;
}

export interface Owner {
  id: string;
  name: string;
  avatar_url?: string;
  initials: string;
}

export interface Member {
  id: string;
  name: string;
  avatar_url?: string;
  initials: string;
  role: 'admin' | 'member';
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

export interface KbFolder {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  icon: string | null;
  color: string | null;
  category: string | null;
  access_level: FolderAccessLevel;
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
  collaborators: User[];
  completions: GoalCompletion[];
}

export interface GoalCompletion {
  id: string;
  date: string;
  value: number;
  notes: string | null;
  userId: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  icon_color: string;
  is_featured: boolean;
}

export type Theme = "light" | "dark" | "system" | "claude" | "claude-light" | "nature" | "nature-light" | "corporate" | "corporate-light" | "ahensi" | "ahensi-light" | "brand-activator" | "brand-activator-light";

export interface ContactProperty {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'email' | 'phone' | 'url' | 'select' | 'multi-select' | 'image' | 'multi-image' | 'checkbox' | 'textarea';
  is_default: boolean;
  options?: string[];
}

export interface Person {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  job_title?: string | null;
  created_at: string;
  updated_at: string;
  department?: string | null;
  social_media?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
  birthday?: string | null;
  notes?: string | null;
  address?: any;
  contact?: {
    emails?: string[];
    phones?: string[];
  };
  projects?: { id: string; name: string; slug: string }[];
  tags?: Tag[];
  user_id?: string | null;
  custom_properties?: Record<string, any>;
  kanban_order?: number;
  company_id?: string | null;
  slug: string;
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