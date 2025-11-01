// User & Auth
export type User = {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  role?: string;
  status?: string;
  initials: string;
  permissions?: string[];
  updated_at?: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  people_kanban_settings?: any;
  theme?: string;
};

export type Collaborator = User & {
  online?: boolean;
  isIdle?: boolean;
  last_active_at?: string;
};

export type AssignedUser = Collaborator & {
  role: 'owner' | 'admin' | 'editor' | 'member';
};

// Projects
export type ProjectStatus = "Requested" | "On Hold" | "Reschedule" | "In Progress" | "Billing Process" | "Completed" | "Cancelled" | "Bid Lost" | "Archived" | "On Track" | "Planning" | "Pending";
export const PROJECT_STATUS_OPTIONS: { label: string; value: ProjectStatus }[] = [
  { label: "Requested", value: "Requested" },
  { label: "On Hold", value: "On Hold" },
  { label: "Reschedule", value: "Reschedule" },
  { label: "In Progress", value: "In Progress" },
  { label: "Billing Process", value: "Billing Process" },
  { label: "Completed", value: "Completed" },
  { label: "Cancelled", value: "Cancelled" },
  { label: "Bid Lost", value: "Bid Lost" },
  { label: "Archived", value: "Archived" },
  { label: "On Track", value: "On Track" },
  { label: "Planning", value: "Planning" },
  { label: "Pending", value: "Pending" },
];

export type Project = {
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
  tasks: Task[];
  comments: Comment[];
  services: string[];
  briefFiles: ProjectFile[];
  activities: Activity[];
  tags: Tag[];
  client_name: string;
  client_avatar_url: string;
  client_company_logo_url: string;
  client_company_name: string;
  client_company_custom_properties: any;
  client_company_id: string | null;
  reactions: Reaction[];
  public: boolean;
  people?: Person[];
  person_ids?: string[];
  kanban_order?: number;
  payment_kanban_order?: number;
  invoice_number?: string;
  po_number?: string;
  paid_date?: string;
  email_sending_date?: string;
  hardcopy_sending_date?: string;
  channel?: string;
  personal_for_user_id?: string;
  created_at: string;
  updated_at: string;
  invoice_attachments?: InvoiceAttachment[];
  payment_terms?: any;
};

// Tasks
export type TaskStatus = 'To do' | 'In Progress' | 'Done' | 'Blocked';
export const TASK_STATUS_OPTIONS: { label: string; value: TaskStatus }[] = [
  { label: 'To do', value: 'To do' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Done', value: 'Done' },
  { label: 'Blocked', value: 'Blocked' },
];

export type TaskPriority = 'Urgent' | 'High' | 'Normal' | 'Low';
export const TASK_PRIORITY_OPTIONS: { label: string; value: TaskPriority }[] = [
    { label: 'Urgent', value: 'Urgent' },
    { label: 'High', value: 'High' },
    { label: 'Normal', value: 'Normal' },
    { label: 'Low', value: 'Low' },
];

export type Task = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  due_date: string;
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
  originTicketId?: string;
  origin_ticket_id?: string;
  attachment_url?: string;
  attachment_name?: string;
  attachments?: TaskAttachment[];
  ticket_attachments?: TaskAttachment[];
  project_venue?: string;
  project_owner?: User;
  project_client?: string;
  reactions: Reaction[];
  kanban_order?: number;
  last_reminder_sent_at?: string;
};

export type UpsertTaskPayload = {
  id?: string | null;
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

// Billing & Invoices
export type PaymentStatus = "Proposed" | "Invoiced" | "Paid" | "Cancelled" | "Overdue" | "Partially Paid" | "Pending" | "In Process" | "Quo Approved" | "Inv Approved" | "Bid Lost";
export const PAYMENT_STATUS_OPTIONS: { label: string; value: PaymentStatus }[] = [
  { label: "Proposed", value: "Proposed" },
  { label: "Invoiced", value: "Invoiced" },
  { label: "Paid", value: "Paid" },
  { label: "Cancelled", value: "Cancelled" },
  { label: "Overdue", value: "Overdue" },
  { label: "Partially Paid", value: "Partially Paid" },
  { label: "Pending", value: "Pending" },
  { label: "In Process", value: "In Process" },
  { label: "Quo Approved", value: "Quo Approved" },
  { label: "Inv Approved", value: "Inv Approved" },
  { label: "Bid Lost", value: "Bid Lost" },
];

export type Invoice = {
  id: string;
  rawProjectId: string;
  projectName: string;
  projectId: string;
  amount: number;
  status: PaymentStatus;
  dueDate: Date;
  clientName?: string;
  clientCompanyName?: string;
  clientLogo?: string | null;
  projectOwner?: User;
  assignedMembers: AssignedUser[];
  poNumber?: string;
  invoice_attachments?: InvoiceAttachment[];
};

// General
export type Tag = {
  id: string;
  name: string;
  color: string;
  user_id?: string | null;
  isNew?: boolean;
  type?: string;
  lead_time?: number | null;
};

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

export type Comment = {
  id: string;
  text: string;
  created_at: string;
  isTicket: boolean;
  attachment_url?: string;
  attachment_name?: string;
  attachments_jsonb?: any[];
  author: User;
  reactions: Reaction[];
  task_id?: string;
};

export type Activity = {
  id: string;
  type: string;
  details: { description: string };
  timestamp: string;
  user: User;
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

export type TaskAttachment = {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  created_at: string;
};

export type InvoiceAttachment = {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  created_at: string;
};

// Goals
export type GoalType = 'frequency' | 'quantity' | 'value';
export type GoalPeriod = 'Weekly' | 'Monthly';
export type Goal = {
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
  frequency: 'Daily' | 'Weekly' | 'Monthly';
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
};
export type GoalCompletion = {
  id: string;
  date: string;
  value: number;
  notes?: string;
  userId: string;
};

// People & Companies
export type Person = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  department: string | null;
  social_media: any;
  birthday: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  projects: Project[];
  tags: Tag[];
  avatar_url: string | null;
  user_id: string | null;
  address: any;
  contact: { emails?: string[], phones?: string[] };
  company_id?: string | null;
  slug: string;
  kanban_order?: number;
  custom_properties?: Record<string, any>;
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
  custom_properties: Record<string, any> | null;
};

export const CONTACT_PROPERTY_TYPES = [
  'text', 'textarea', 'number', 'date', 'email', 'phone', 'url', 'image', 'multi-image', 'select', 'multi-select', 'checkbox'
] as const;
export type ContactPropertyType = typeof CONTACT_PROPERTY_TYPES[number];
export type ContactProperty = {
  id: string;
  name: string;
  label: string;
  type: ContactPropertyType;
  is_default: boolean;
  options?: string[];
};

export const COMPANY_PROPERTY_TYPES = [
  'text', 'textarea', 'number', 'date', 'email', 'phone', 'url', 'image', 'select'
] as const;
export type CompanyPropertyType = typeof COMPANY_PROPERTY_TYPES[number];
export type CompanyProperty = {
  id: string;
  name: string;
  label: string;
  type: CompanyPropertyType;
  options?: string[];
  is_default?: boolean;
};

// Chat
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
export type ConversationMessage = {
  sender: 'ai' | 'user';
  content: string;
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

// Other
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

export type Service = {
  id: string;
  title: string;
  description: string;
  icon: string;
  icon_color: string;
  is_featured: boolean;
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
};

export type Theme = "light" | "dark" | "system" | "claude" | "claude-light" | "nature" | "nature-light" | "corporate" | "corporate-light" | "ahensi" | "ahensi-light" | "brand-activator" | "brand-activator-light";