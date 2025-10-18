export const PROJECT_STATUS_OPTIONS = [
  { value: 'On Track', label: 'On Track' },
  { value: 'In Progress', label: 'In Progress' },
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
  { value: 'Unpaid', label: 'Unpaid' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'Pending', label: 'Pending' },
  { value: 'In Process', label: 'In Process' },
  { value: 'Proposed', label: 'Proposed' },
  { value: 'Cancelled', label: 'Cancelled' },
] as const;

export type ProjectStatus = typeof PROJECT_STATUS_OPTIONS[number]['value'];
export type PaymentStatus = typeof PAYMENT_STATUS_OPTIONS[number]['value'];

export const TASK_STATUS_OPTIONS = [
  { value: 'To do', label: 'To do' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Done', label: 'Done' },
  { value: 'Cancelled', label: 'Cancelled' },
] as const;

export type TaskStatus = typeof TASK_STATUS_OPTIONS[number]['value'];

export const TASK_PRIORITY_OPTIONS = [
  { value: 'Urgent', label: 'Urgent' },
  { value: 'High', label: 'High' },
  { value: 'Normal', label: 'Normal' },
  { value: 'Low', label: 'Low' },
] as const;

export type TaskPriority = typeof TASK_PRIORITY_OPTIONS[number]['value'];

export interface User {
  id: string;
  name: string;
  avatar_url: string | null;
  email: string;
  initials: string;
  first_name: string | null;
  last_name: string | null;
  role?: string;
  status?: string;
  updated_at?: string;
  permissions?: string[];
  people_kanban_settings?: any;
  theme?: string;
  phone?: string;
  notification_preferences?: Record<string, any>;
}

export interface Person {
  id: string;
  full_name: string;
  contact?: { emails?: string[], phones?: string[] };
  company?: string;
  job_title?: string;
  department?: string;
  social_media?: any;
  birthday?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  avatar_url?: string;
  user_id?: string;
  address?: any;
  company_id?: string;
  slug?: string;
  projects?: { id: string, name: string, slug: string }[];
  tags?: Tag[];
  custom_properties?: Record<string, any>;
  kanban_order?: number;
  email?: string;
  phone?: string;
}

export interface Company {
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
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id?: string;
  isNew?: boolean;
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
  storage_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  due_date: string | null;
  priority: string;
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
  originTicketId?: string;
  attachment_url?: string;
  attachment_name?: string;
  attachments?: TaskAttachment[];
  project_venue?: string;
  project_owner?: { id: string, name: string };
  project_client?: string;
  reactions?: Reaction[];
  kanban_order?: number;
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

export interface Activity {
  id: string;
  type: string;
  details: { description: string };
  timestamp: string;
  user: User;
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  start_date: string;
  due_date: string;
  payment_status: PaymentStatus;
  payment_due_date: string;
  origin_event_id: string;
  venue: string;
  created_by: User;
  assignedTo: AssignedUser[];
  services: string[];
  tags: Tag[];
  kanban_order: number;
  payment_kanban_order: number;
  invoice_number: string;
  po_number: string;
  paid_date: string;
  email_sending_date: string;
  hardcopy_sending_date: string;
  channel: string;
  invoice_attachments: InvoiceAttachment[];
  client_name: string;
  client_avatar_url: string;
  client_company_logo_url: string;
  client_company_name: string;
  client_company_custom_properties: any;
  client_company_id: string;
  tasks?: Task[];
  comments?: Comment[];
  briefFiles: ProjectFile[];
  activities?: Activity[];
  people?: Person[];
  person_ids?: string[];
}

export interface Collaborator extends User {
  online?: boolean;
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

export interface InvoiceAttachment {
  id: string;
  file_name: string;
  file_url: string;
  storage_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export type ContactPropertyType = 'text' | 'textarea' | 'number' | 'date' | 'email' | 'phone' | 'url' | 'image' | 'select' | 'multi-select' | 'checkbox';

export interface ContactProperty {
  id: string;
  name: string;
  label: string;
  type: ContactPropertyType;
  is_default: boolean;
  options?: string[];
}

export type CompanyPropertyType = 'text' | 'textarea' | 'number' | 'date' | 'email' | 'phone' | 'url' | 'image' | 'select';

export interface CompanyProperty {
  id: string;
  name: string;
  label: string;
  type: CompanyPropertyType;
  options?: string[] | null;
}

export interface Reaction {
  emoji: string;
  user_id: string;
  user_name: string;
}

export interface Attachment {
  name: string;
  url: string;
  type: string;
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
  description: string;
  icon: string;
  icon_url?: string;
  color: string;
  type: GoalType;
  target_quantity?: number;
  target_value?: number;
  frequency: 'Daily' | 'Weekly';
  target_period?: GoalPeriod;
  unit?: string;
  specific_days?: string[];
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

export type Theme = "light" | "dark" | "system" | "claude" | "claude-light" | "nature" | "nature-light" | "corporate" | "corporate-light" | "ahensi" | "ahensi-light" | "brand-activator" | "brand-activator-light";

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

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  icon_color: string;
  is_featured: boolean;
}