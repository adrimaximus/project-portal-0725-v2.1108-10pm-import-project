export interface User {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string | null;
  avatar_url: string | null;
  name?: string; // Often added dynamically
  initials?: string; // Often added dynamically
  role?: string;
  status?: string;
  updated_at?: string;
  people_kanban_settings?: any;
  permissions?: string[];
  theme?: string;
  phone?: string;
}

export type Collaborator = User;

export interface Tag {
  id: string;
  name: string;
  color: string;
  isNew?: boolean;
  user_id?: string;
  type?: string;
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

export interface Reaction {
  id: string;
  emoji: string;
  user_id: string;
  user_name: string;
}

export type TaskStatus = 'To do' | 'In Progress' | 'In Review' | 'Done';
export const TASK_STATUS_OPTIONS: { value: TaskStatus, label: string }[] = [
    { value: 'To do', label: 'To do' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'In Review', label: 'In Review' },
    { value: 'Done', label: 'Done' },
];

export const TASK_PRIORITY_OPTIONS = [
    { value: 'Urgent', label: 'Urgent' },
    { value: 'High', label: 'High' },
    { value: 'Normal', label: 'Normal' },
    { value: 'Low', label: 'Low' },
];

export interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  due_date: string | null;
  priority: string | null;
  project_id: string;
  project_name: string | null;
  project_slug: string | null;
  project_status: string | null;
  assignedTo: User[] | null;
  created_by: User;
  created_at: string;
  updated_at: string;
  status: TaskStatus;
  tags: Tag[] | null;
  originTicketId: string | null;
  attachments: TaskAttachment[] | null;
  ticket_attachments?: TaskAttachment[] | null;
  reactions: Reaction[] | null;
  kanban_order?: number;
  project_venue?: string;
  project_owner?: { id: string; name: string };
  project_client?: string;
}

export interface Comment {
  id: string;
  text: string;
  timestamp: string;
  author: User;
  isTicket: boolean;
  attachment_url?: string;
  attachment_name?: string;
  attachments_jsonb?: any;
}

export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  storage_path: string;
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
  contact: {
    emails: string[];
    phones: string[];
  } | null;
  company: string | null;
  job_title: string | null;
  department: string | null;
  birthday: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  avatar_url: string | null;
  user_id: string | null;
  email: string | null;
  phone: string | null;
  custom_properties: Record<string, any> | null;
  kanban_order?: number;
  company_id?: string | null;
  slug: string;
  address: any;
  social_media: any;
  projects?: { id: string; name: string; slug: string }[];
  tags?: Tag[];
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

export interface AssignedUser extends User {
  role: 'owner' | 'admin' | 'editor' | 'member';
}

export type ProjectStatus = 'Requested' | 'Idea' | 'On Track' | 'In Progress' | 'In Review' | 'Completed' | 'On Hold' | 'At Risk' | 'Off Track' | 'Cancelled';
export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus, label: string }[] = [
    { value: 'Requested', label: 'Requested' },
    { value: 'Idea', label: 'Idea' },
    { value: 'On Track', label: 'On Track' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'In Review', label: 'In Review' },
    { value: 'Completed', label: 'Completed' },
    { value: 'On Hold', label: 'On Hold' },
    { value: 'At Risk', label: 'At Risk' },
    { value: 'Off Track', label: 'Off Track' },
    { value: 'Cancelled', label: 'Cancelled' },
];

export type PaymentStatus = 'Paid' | 'Unpaid' | 'Overdue' | 'Pending' | 'In Process' | 'Proposed' | 'Cancelled';
export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus, label: string }[] = [
    { value: 'Paid', label: 'Paid' },
    { value: 'Unpaid', label: 'Unpaid' },
    { value: 'Overdue', label: 'Overdue' },
    { value: 'Pending', label: 'Pending' },
    { value: 'In Process', label: 'In Process' },
    { value: 'Proposed', label: 'Proposed' },
    { value: 'Cancelled', label: 'Cancelled' },
];

export interface Project {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  budget: number | null;
  start_date: string | null;
  due_date: string | null;
  payment_status: PaymentStatus;
  payment_due_date: string | null;
  origin_event_id: string | null;
  venue: string | null;
  created_by: User;
  assignedTo: AssignedUser[];
  tasks: Task[];
  comments: Comment[];
  services: string[];
  briefFiles: ProjectFile[];
  activities: Activity[];
  tags: Tag[];
  client_name: string | null;
  client_avatar_url: string | null;
  client_company_logo_url: string | null;
  client_company_name: string | null;
  client_company_custom_properties: any;
  client_company_id: string | null;
  people?: Person[];
  person_ids?: string[];
  invoice_number?: string | null;
  po_number?: string | null;
  paid_date?: string | null;
  email_sending_date?: string | null;
  hardcopy_sending_date?: string | null;
  channel?: string | null;
  invoice_attachments?: InvoiceAttachment[];
  personal_for_user_id?: string | null;
  payment_terms?: any[];
  kanban_order?: number;
  payment_kanban_order?: number;
  reactions?: Reaction[];
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
  payment_terms: any[];
}

export interface Owner {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  initials: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  initials: string;
  role: 'owner' | 'admin' | 'editor' | 'member';
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

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  icon_color: string;
  is_featured: boolean;
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
  reactions?: Reaction[];
}

export interface AppNotification {
  id: string;
  type: 'comment' | 'mention' | 'project' | 'system' | 'goal' | 'project_update';
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

export const CONTACT_PROPERTY_TYPES = ['text', 'email', 'phone', 'url', 'date', 'textarea', 'number', 'image', 'multi-image', 'select', 'multi-select', 'checkbox'] as const;
export type ContactPropertyType = typeof CONTACT_PROPERTY_TYPES[number];

export interface ContactProperty {
  id: string;
  name: string;
  label: string;
  type: ContactPropertyType;
  is_default: boolean;
  options?: string[];
}

export const COMPANY_PROPERTY_TYPES = ['text', 'textarea', 'number', 'date', 'email', 'phone', 'url', 'image', 'select'] as const;
export type CompanyPropertyType = typeof COMPANY_PROPERTY_TYPES[number];

export interface CompanyProperty {
  id: string;
  name: string;
  label: string;
  type: CompanyPropertyType;
  is_default: boolean;
  options?: string[];
}

export type Theme = "light" | "dark" | "system" | "claude" | "claude-light" | "nature" | "nature-light" | "corporate" | "corporate-light" | "ahensi" | "ahensi-light" | "brand-activator" | "brand-activator-light";

export interface Attachment {
  name: string;
  url: string;
  type: string;
}

export interface Message {
  id: string;
  text: string | null;
  timestamp: string;
  sender: User | Collaborator;
  attachment?: Attachment;
  reply_to_message_id?: string | null;
  repliedMessage?: {
    content: string | null;
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