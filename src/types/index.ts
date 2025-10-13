export type Theme = "dark" | "light" | "system" | "claude" | "claude-light" | "nature" | "nature-light" | "corporate" | "corporate-light" | "ahensi" | "ahensi-light" | "brand-activator" | "brand-activator-light";

export const PROJECT_STATUS_OPTIONS = [
  { value: 'Requested', label: 'Requested' },
  { value: 'On Track', label: 'On Track' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'In Review', label: 'In Review' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'At Risk', label: 'At Risk' },
  { value: 'Off Track', label: 'Off Track' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
] as const;

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'Paid', label: 'Paid' },
  { value: 'Unpaid', label: 'Unpaid' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'In Process', label: 'In Process' },
  { value: 'Proposed', label: 'Proposed' },
  { value: 'Cancelled', label: 'Cancelled' },
] as const;

export const TASK_STATUS_OPTIONS = [
  { value: 'To do', label: 'To do' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Done', label: 'Done' },
  { value: 'Cancelled', label: 'Cancelled' },
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
export type TaskPriority = string;

export interface User {
  id: string;
  name: string;
  email?: string | null;
  avatar_url?: string | null;
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

export type Collaborator = User;
export type AssignedUser = User & { role?: string };

export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id?: string;
  isNew?: boolean;
  type?: string;
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

export interface TaskAssignee {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

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
  assignees: TaskAssignee[];
  created_by: User & { first_name?: string, last_name?: string, avatar_url?: string, email?: string };
  created_at: string;
  updated_at: string | null;
  status: TaskStatus;
  tags: Tag[];
  originTicketId?: string | null;
  attachment_url?: string;
  attachment_name?: string;
  attachments?: TaskAttachment[];
  project_venue?: string | null;
  project_owner?: { id: string; name: string; } | null;
  project_client?: string | null;
}

export interface Comment {
  id: string;
  text: string;
  timestamp: string;
  author: User;
  isTicket: boolean;
  attachment_url?: string;
  attachment_name?: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  status: ProjectStatus;
  progress: number;
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
  briefFiles: ProjectFile[];
  activities: Activity[];
  tags: Tag[];
  venue: string | null;
  people?: Person[];
  person_ids?: string[];
  invoice_number?: string | null;
  po_number?: string | null;
  paid_date?: string | null;
  email_sending_date?: string | null;
  hardcopy_sending_date?: string | null;
  channel?: string | null;
  invoice_attachments?: InvoiceAttachment[];
  client_name?: string | null;
  client_avatar_url?: string | null;
  client_company_logo_url?: string | null;
  client_company_name?: string | null;
  client_company_custom_properties?: any;
  updated_at?: string;
  kanban_order?: number;
  payment_kanban_order?: number;
}

export interface GoalCompletion {
  id: string;
  date: string;
  value: number;
  notes?: string;
  userId: string;
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
  frequency: 'Daily' | 'Weekly' | 'Monthly';
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
  name: string;
  description: string | null;
  slug: string;
  icon: string | null;
  color: string | null;
  category: string | null;
  access_level: FolderAccessLevel;
  updated_at: string;
  last_modified_by: string | null;
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
}

export interface Conversation {
  id: string;
  userName: string;
  userAvatar: string | null;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  isGroup: boolean;
  members: Collaborator[];
  messages: Message[];
  created_by: string;
  other_user_id?: string;
}

export interface Invoice {
  id: string;
  projectId: string;
  projectName: string;
  clientName: string | null;
  clientLogo: string | null;
  clientAvatarUrl: string | null;
  clientCompanyName: string | null;
  projectOwner: Owner | null;
  assignedMembers: Member[];
  status: PaymentStatus;
  poNumber: string | null;
  amount: number;
  dueDate: Date;
  invoiceAttachments: InvoiceAttachment[];
  rawProjectId: string;
  projectStartDate: Date | null;
  projectEndDate: Date | null;
  paidDate: Date | null;
  emailSendingDate: Date | null;
  hardcopySendingDate: Date | null;
  channel: string | null;
}

export interface ExtendedProject extends Project {
  client_name?: string;
  client_avatar_url?: string | null;
  client_company_logo_url?: string;
  client_company_name?: string;
}

export interface Member {
  id: string;
  name: string;
  avatar_url: string;
  initials: string;
  role: 'admin' | 'member' | 'editor';
}

export interface Owner {
  id: string;
  name: string;
  avatar_url: string;
  initials: string;
}

export interface ContactProperty {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'url' | 'date' | 'textarea' | 'number' | 'image' | 'select' | 'multi-select' | 'checkbox';
  is_default: boolean;
  options?: string[];
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

export interface CompanyProperty {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'email' | 'phone' | 'url' | 'image' | 'select';
  options: string[] | null;
  is_default?: boolean;
}

export interface Person {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  department: string | null;
  social_media: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  } | null;
  birthday: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  avatar_url: string | null;
  user_id: string | null;
  address: {
    formatted_address: string;
  } | null;
  contact: {
    emails: string[];
    phones: string[];
  } | null;
  projects: { id: string; name: string; slug: string }[] | null;
  tags: Tag[] | null;
  custom_properties: Record<string, any> | null;
  kanban_order?: number;
  slug: string;
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
    avatar_url: string;
    initials: string;
  };
}

export interface Notification {
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
    avatar: string;
  }
};