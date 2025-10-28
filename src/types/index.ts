export type Theme = "dark" | "light" | "system" | "claude" | "claude-light" | "nature" | "nature-light" | "corporate" | "corporate-light" | "ahensi" | "ahensi-light" | "brand-activator" | "brand-activator-light";

export interface User {
  id: string;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  avatar_url?: string;
  initials: string;
  role?: string;
  status?: string;
  updated_at?: string;
  permissions?: string[];
  people_kanban_settings?: any;
  theme?: string;
  phone?: string | null;
}

export interface Collaborator extends User {
  role?: string;
}

export interface Owner extends User {}
export interface AssignedUser extends User {
  role: 'owner' | 'admin' | 'editor' | 'member';
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id?: string | null;
  isNew?: boolean;
  type?: string;
}

export interface Person {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  company?: string;
  company_id?: string | null;
  job_title?: string;
  department?: string;
  social_media?: any;
  birthday?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  projects?: { id: string; name: string; slug: string }[];
  tags?: Tag[];
  avatar_url?: string;
  user_id?: string | null;
  address?: any;
  contact?: { emails?: string[]; phones?: string[] };
  slug: string;
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
  created_at?: string;
  updated_at?: string;
  user_id?: string | null;
  custom_properties?: Record<string, any>;
}

export type TaskStatus = 'To do' | 'In Progress' | 'Done' | 'Cancelled';

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

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  due_date?: string | null;
  priority: string;
  project_id: string;
  project_name?: string;
  project_slug?: string;
  project_status?: string;
  assignedTo?: User[];
  created_by: User;
  created_at: string;
  updated_at: string;
  status: TaskStatus;
  tags?: Tag[];
  origin_ticket_id?: string | null;
  originTicketId?: string | null; // Alias for frontend consistency
  attachment_url?: string;
  attachment_name?: string;
  attachments?: TaskAttachment[];
  ticket_attachments?: TaskAttachment[];
  reactions?: Reaction[];
  kanban_order?: number;
}

export type UpsertTaskPayload = {
  id?: string;
  project_id: string;
  title: string;
  description?: string;
  due_date?: string | null;
  priority?: string;
  status?: string;
  completed?: boolean;
  assignee_ids?: string[];
  tag_ids?: string[];
  new_files?: File[];
  deleted_files?: string[];
};

export interface Comment {
  id: string;
  text: string;
  timestamp: string;
  isTicket: boolean;
  attachment_url?: string;
  attachment_name?: string;
  attachments_jsonb?: any[];
  author: User;
  reactions?: Reaction[];
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

export interface Activity {
  id: string;
  type: string;
  details: {
    description: string;
  };
  timestamp: string; // created_at
  user: {
    id: string;
    name: string;
    avatar_url?: string;
    initials: string;
  };
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

export interface Project {
  id: string;
  slug: string;
  name: string;
  category?: string;
  description?: string;
  status: string;
  progress?: number;
  budget?: number;
  start_date?: string;
  due_date?: string;
  payment_status: string;
  payment_due_date?: string;
  origin_event_id?: string;
  venue?: string;
  created_by: Owner;
  assignedTo: AssignedUser[];
  tasks?: Task[];
  comments?: Comment[];
  services?: string[];
  briefFiles: ProjectFile[];
  activities?: Activity[];
  tags: Tag[];
  client_name?: string;
  client_avatar_url?: string;
  client_company_logo_url?: string;
  client_company_name?: string;
  client_company_custom_properties?: any;
  client_company_id?: string | null;
  reactions?: Reaction[];
  public?: boolean;
  people?: Person[];
  person_ids?: string[];
  personal_for_user_id?: string | null;
  invoice_number?: string | null;
  po_number?: string | null;
  paid_date?: string | null;
  email_sending_date?: string | null;
  hardcopy_sending_date?: string | null;
  channel?: string | null;
  invoice_attachments?: InvoiceAttachment[];
  payment_terms?: any[];
  kanban_order?: number;
  payment_kanban_order?: number;
}

export const PROJECT_STATUS_OPTIONS = [
  { value: 'Requested', label: 'Requested' },
  { value: 'Proposed', label: 'Proposed' },
  { value: 'Bid Win', label: 'Bid Win' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'In Review', label: 'In Review' },
  { value: 'Completed', label: 'Completed' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Bid Lost', label: 'Bid Lost' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export type PaymentStatus = 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Pending' | 'In Process' | 'Proposed' | 'Cancelled';

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus, label: string }[] = [
    { value: 'Unpaid', label: 'Unpaid' },
    { value: 'Partially Paid', label: 'Partially Paid' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Overdue', label: 'Overdue' },
    { value: 'Pending', label: 'Pending' },
    { value: 'In Process', label: 'In Process' },
    { value: 'Proposed', label: 'Proposed' },
    { value: 'Cancelled', label: 'Cancelled' },
];

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'To do', label: 'To do' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Done', label: 'Done' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export const TASK_PRIORITY_OPTIONS = [
  { value: 'Urgent', label: 'Urgent' },
  { value: 'High', label: 'High' },
  { value: 'Normal', label: 'Normal' },
  { value: 'Low', label: 'Low' },
];

export type ContactPropertyType = 'text' | 'textarea' | 'number' | 'date' | 'email' | 'phone' | 'url' | 'image' | 'multi-image' | 'select' | 'multi-select' | 'checkbox';
export const CONTACT_PROPERTY_TYPES: ContactPropertyType[] = ['text', 'textarea', 'number', 'date', 'email', 'phone', 'url', 'image', 'multi-image', 'select', 'multi-select', 'checkbox'];

export interface ContactProperty {
  id: string;
  name: string;
  label: string;
  type: ContactPropertyType;
  options?: string[];
  is_default: boolean;
}

export type CompanyPropertyType = 'text' | 'textarea' | 'number' | 'date' | 'email' | 'phone' | 'url' | 'image' | 'select';
export const COMPANY_PROPERTY_TYPES: CompanyPropertyType[] = ['text', 'textarea', 'number', 'date', 'email', 'phone', 'url', 'image', 'select'];

export interface CompanyProperty {
  id: string;
  name: string;
  label: string;
  type: CompanyPropertyType;
  options?: string[];
  is_default?: boolean;
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
  collaborators: User[];
  completions: GoalCompletion[];
  reactions: Reaction[];
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  icon_color: string;
  is_featured: boolean;
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
    avatar_url?: string;
  };
}

export interface Attachment {
  name: string;
  url: string;
  type: string;
}

export interface Message {
  id: string;
  text: string | null;
  timestamp: string;
  sender: User;
  attachment?: Attachment;
  reply_to_message_id?: string | null;
  repliedMessage?: {
    content: string | null;
    senderName: string;
    isDeleted: boolean;
  } | null;
  is_deleted?: boolean;
  is_forwarded?: boolean;
  reactions?: Reaction[];
}

export interface Conversation {
  id: string;
  userName: string;
  userAvatar?: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  isGroup: boolean;
  members: User[];
  messages: Message[];
  created_by: string;
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
  kb_folders: { name: string; slug: string };
  tags: Tag[];
  creator: User;
  kb_article_reactions: any[];
}

export interface Invoice {
  id: string;
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
  payment_terms: { amount: number; date: string }[];
}

export interface Member extends User {
  role: 'owner' | 'admin' | 'editor' | 'member';
}