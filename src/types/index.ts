import { Database } from './supabase';

// Base Supabase types
export type DbProject = Database['public']['Tables']['projects']['Row'];
export type DbTask = Database['public']['Tables']['tasks']['Row'];
export type DbComment = Database['public']['Tables']['comments']['Row'];
export type DbUser = Database['public']['Tables']['profiles']['Row'];
export type DbReaction = Database['public']['Tables']['comment_reactions']['Row'];
export type DbTag = Database['public']['Tables']['tags']['Row'];
export type DbGoal = Database['public']['Tables']['goals']['Row'];
export type DbGoalCompletion = Database['public']['Tables']['goal_completions']['Row'];
export type DbKbArticle = Database['public']['Tables']['kb_articles']['Row'];
export type DbKbFolder = Database['public']['Tables']['kb_folders']['Row'];
export type DbService = Database['public']['Tables']['services']['Row'];
export type DbCompany = Database['public']['Tables']['companies']['Row'];
export type DbPerson = Database['public']['Tables']['people']['Row'];
export type DbNotification = Database['public']['Tables']['notifications']['Row'];
export type DbTaskAttachment = Database['public']['Tables']['task_attachments']['Row'];

// Enriched Application Types
export type User = DbUser & { 
  permissions?: string[];
  name: string;
  initials: string;
};

export type Collaborator = Pick<User, 'id' | 'name' | 'avatar_url' | 'initials' | 'email' | 'first_name' | 'last_name'> & { isIdle?: boolean };
export type Owner = Pick<User, 'id' | 'name' | 'avatar_url' | 'initials' | 'email'>;
export type Member = Pick<User, 'id' | 'name' | 'avatar_url' | 'initials' | 'email'> & { role: string };
export type AssignedUser = Member;

export type Reaction = DbReaction & { user_name?: string };
export type ArticleReaction = {
  id: string;
  emoji: string;
  user_id: string;
  profiles?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
};

export type Attachment = {
  name: string;
  url: string;
  type: string;
};

export type TaskAttachment = DbTaskAttachment;

export type Comment = DbComment & {
  author: User;
  reactions: Reaction[];
  attachments_jsonb?: TaskAttachment[];
};

export type Tag = DbTag & { isNew?: boolean };

export type Task = Omit<Database['public']['Functions']['get_project_tasks']['Returns'][0], 'assignedTo'> & {
  assignedTo: User[];
  originTicketId?: string | null;
  ticket_attachments?: TaskAttachment[];
};

export type ProjectFile = {
  id: string;
  name: string;
  size: number;
  type: string | null;
  url: string;
  storage_path: string;
  created_at: string;
};

export type Project = Omit<Database['public']['Functions']['get_dashboard_projects']['Returns'][0], 'assignedTo' | 'tasks' | 'comments' | 'briefFiles' | 'activities' | 'tags' | 'created_by'> & {
  assignedTo: AssignedUser[];
  tasks: Task[];
  comments: Comment[];
  briefFiles: ProjectFile[];
  activities: Activity[];
  tags: Tag[];
  created_by: Owner;
  people?: Person[];
  person_ids?: string[];
  invoice_attachments?: InvoiceAttachment[];
  payment_terms?: { amount: number; date: string }[];
};

export type Activity = {
  id: string;
  type: string;
  details: { description: string };
  timestamp: string;
  user: User | null;
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

export type InvoiceAttachment = {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  created_at: string;
};

export type KbFolder = DbKbFolder;
export type KbArticle = DbKbArticle & {
  kb_folders: { name: string; slug: string };
  tags: Tag[];
  creator: User;
  kb_article_reactions: ArticleReaction[];
};

export type Service = DbService;
export type Person = DbPerson & {
  projects?: Pick<Project, 'id' | 'name' | 'slug'>[];
  tags?: Tag[];
};
export type Company = DbCompany;

export type Goal = DbGoal & {
  tags: Tag[];
  collaborators: User[];
  completions: GoalCompletion[];
  reactions: Reaction[];
};
export type GoalCompletion = DbGoalCompletion;
export type GoalType = 'frequency' | 'quantity' | 'value';
export type GoalPeriod = 'Weekly' | 'Monthly';

export type FolderAccessLevel = 'private' | 'public_view' | 'public_edit';

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  link: string | null;
  actor: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
};

export const CONTACT_PROPERTY_TYPES = [
  "text", "textarea", "number", "date", "email", "phone", "url", "image", "multi-image", "select", "multi-select", "checkbox"
] as const;
export type ContactPropertyType = typeof CONTACT_PROPERTY_TYPES[number];
export type ContactProperty = {
  id: string;
  name: string;
  label: string;
  type: ContactPropertyType;
  options?: string[];
  is_default: boolean;
};

export const COMPANY_PROPERTY_TYPES = [
  "text", "textarea", "number", "date", "email", "phone", "url", "image", "select"
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

export const PROJECT_STATUSES = [
  "Requested",
  "On Hold",
  "Reschedule",
  "In Progress",
  "Billing Process",
  "Completed",
  "Cancelled",
  "Bid Lost",
  "Archived",
] as const;
export type ProjectStatus = typeof PROJECT_STATUSES[number];
export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "Requested", label: "Requested" },
  { value: "On Hold", label: "On Hold" },
  { value: "Reschedule", label: "Reschedule" },
  { value: "In Progress", label: "In Progress" },
  { value: "Billing Process", label: "Billing Process" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Bid Lost", label: "Bid Lost" },
  { value: "Archived", label: "Archived" },
];

export const PAYMENT_STATUSES = ['Unpaid', 'Partially Paid', 'Paid', 'Overdue', 'Pending', 'In Process'] as const;
export type PaymentStatus = typeof PAYMENT_STATUSES[number];
export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'Unpaid', label: 'Unpaid' },
  { value: 'Partially Paid', label: 'Partially Paid' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'Pending', label: 'Pending' },
  { value: 'In Process', label: 'In Process' },
];

export const TASK_STATUSES = ["To do", "In progress", "In review", "Done"] as const;
export type TaskStatus = typeof TASK_STATUSES[number];
export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
    { value: "To do", label: "To do" },
    { value: "In progress", label: "In progress" },
    { value: "In review", label: "In review" },
    { value: "Done", label: "Done" },
];

export const TASK_PRIORITIES = ["Urgent", "High", "Medium", "Normal", "Low"] as const;
export type TaskPriority = typeof TASK_PRIORITIES[number];
export const TASK_PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
    { value: "Urgent", label: "Urgent" },
    { value: "High", label: "High" },
    { value: "Medium", label: "Medium" },
    { value: "Normal", label: "Normal" },
    { value: "Low", label: "Low" },
];

export type UpsertTaskPayload = {
  id?: string;
  project_id: string;
  title: string;
  description?: string;
  due_date?: string | null;
  priority?: TaskPriority | null;
  status?: TaskStatus;
  completed?: boolean;
  assignee_ids?: string[];
  tag_ids?: string[];
  new_files?: File[];
  deleted_files?: string[];
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

export type ConversationMessage = {
  sender: 'ai' | 'user';
  content: string;
};

export type Theme = "light" | "dark" | "system" | "claude" | "claude-light" | "nature" | "nature-light" | "corporate" | "corporate-light" | "ahensi" | "ahensi-light" | "brand-activator" | "brand-activator-light";