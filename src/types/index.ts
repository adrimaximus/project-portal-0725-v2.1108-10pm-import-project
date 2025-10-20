export type User = {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  initials: string;
  role?: string;
  permissions?: string[];
  first_name?: string | null;
  last_name?: string | null;
  status?: string;
  phone?: string | null;
  updated_at?: string;
  people_kanban_settings?: any;
  theme?: string;
};

export type Collaborator = User & {
  online?: boolean;
};

export type AssignedUser = User & {
  role: string;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
  isNew?: boolean;
  user_id?: string | null;
  type?: string;
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

export type Comment = {
  id: string;
  text: string;
  timestamp: string;
  author: User;
  isTicket: boolean;
  attachment_url?: string;
  attachment_name?: string;
};

export type Activity = {
  id: string;
  type: string;
  details: { description: string };
  timestamp: string;
  user: User | null;
};

export type Project = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  budget: number | null;
  start_date: string | null;
  due_date: string | null;
  payment_status: PaymentStatus;
  payment_due_date: string | null;
  created_by: User;
  assignedTo: AssignedUser[];
  services: string[];
  tags: Tag[];
  briefFiles: ProjectFile[];
  comments: Comment[];
  tasks: Task[];
  activities: Activity[];
  personal_for_user_id?: string | null;
  client_name?: string | null;
  client_avatar_url?: string | null;
  client_company_name?: string | null;
  client_company_logo_url?: string | null;
  invoice_attachments?: InvoiceAttachment[];
  people?: Person[];
  person_ids?: string[];
  client_company_id?: string | null;
  venue?: string | null;
  invoice_number?: string | null;
  po_number?: string | null;
  paid_date?: string | null;
  email_sending_date?: string | null;
  hardcopy_sending_date?: string | null;
  channel?: string | null;
  kanban_order?: number;
  payment_kanban_order?: number;
  category?: string | null;
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
  priority: string;
  project_id: string;
  project_name: string;
  project_slug: string;
  assignedTo: User[];
  created_by: User;
  created_at: string;
  updated_at: string;
  status: TaskStatus;
  tags: Tag[];
  attachments?: TaskAttachment[];
  originTicketId?: string | null;
  origin_ticket_id?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  project_venue?: string | null;
  project_owner?: { id: string; name: string };
  project_client?: string | null;
  reactions?: Reaction[];
  kanban_order?: number;
};

export type TaskStatus = 'To do' | 'In progress' | 'In review' | 'Done';

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'To do', label: 'To do' },
  { value: 'In progress', label: 'In progress' },
  { value: 'In review', label: 'In review' },
  { value: 'Done', label: 'Done' },
];

export const TASK_PRIORITY_OPTIONS = [
  { value: 'Urgent', label: 'Urgent' },
  { value: 'High', label: 'High' },
  { value: 'Normal', label: 'Normal' },
  { value: 'Low', label: 'Low' },
];

export type ProjectStatus = 'On Track' | 'In Progress' | 'In Review' | 'At Risk' | 'On Hold' | 'Off Track' | 'Completed' | 'Cancelled' | 'Requested' | 'Idea';

export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'On Track', label: 'On Track' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'In Review', label: 'In Review' },
  { value: 'At Risk', label: 'At Risk' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Off Track', label: 'Off Track' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Requested', label: 'Requested' },
  { value: 'Idea', label: 'Idea' },
];

export type PaymentStatus = 'Paid' | 'Overdue' | 'Unpaid' | 'Pending' | 'In Process' | 'Proposed' | 'Cancelled';

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'Paid', label: 'Paid' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'Unpaid', label: 'Unpaid' },
  { value: 'Pending', label: 'Pending' },
  { value: 'In Process', label: 'In Process' },
  { value: 'Proposed', label: 'Proposed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

// Chat types
export type Attachment = {
  name: string;
  url: string;
  type: string;
};

export type Reaction = {
  id?: string;
  emoji: string;
  user_id: string;
  user_name: string;
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

// Billing types
export type InvoiceAttachment = {
  id: string;
  file_name: string;
  file_url: string;
  storage_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
};

export type Owner = {
  id: string;
  name: string;
  avatar_url: string;
  initials: string;
  email: string;
};

export type Member = {
  id: string;
  name: string;
  avatar_url: string;
  initials: string;
  role: string;
  email: string;
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
};

// Service types
export type Service = {
  id: string;
  title: string;
  description: string;
  icon: string;
  icon_color: string;
  is_featured: boolean;
};

// Knowledge Base types
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
  creator: User;
};

// People & Company types
export type Person = {
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
  projects: { id: string; name: string; slug: string }[];
  tags: Tag[];
  avatar_url: string | null;
  user_id: string | null;
  address: any;
  contact: { emails: string[], phones: string[] } | null;
  custom_properties?: Record<string, any>;
  kanban_order?: number;
  company_id?: string | null;
  slug?: string;
};

export type Company = {
  id: string;
  name: string;
  legal_name: string | null;
  address: string | null;
  billing_address: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  custom_properties?: Record<string, any>;
};

export type ContactProperty = {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'url' | 'date' | 'textarea' | 'number' | 'image' | 'multi-image' | 'select' | 'multi-select' | 'checkbox';
  is_default: boolean;
  options?: string[];
};

export type CompanyProperty = {
  id: string;
  name: string;
  label: string;
  type: string;
  options: string[] | null;
};

// Notification types
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

// Goal types
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
  collaborators: User[];
  completions: GoalCompletion[];
};

// Theme types
export type Theme = "light" | "dark" | "system" | "claude" | "claude-light" | "nature" | "nature-light" | "corporate" | "corporate-light" | "ahensi" | "ahensi-light" | "brand-activator" | "brand-activator-light";