// General
export interface User {
  id: string;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  avatar_url: string | null;
  initials: string;
  role?: string;
  status?: string;
  people_kanban_settings?: any;
  updated_at?: string;
  permissions?: string[];
}

export type Collaborator = User;
export type AssignedUser = User;

export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id?: string;
  type?: string;
  isNew?: boolean;
}

// Projects
export type ProjectStatus = 'Requested' | 'In Progress' | 'In Review' | 'On Hold' | 'Completed' | 'Cancelled' | 'On Track' | 'At Risk' | 'Off Track' | 'Archived' | 'Idea' | 'Done';
export type PaymentStatus = 'Paid' | 'Unpaid' | 'Pending' | 'Overdue' | 'Cancelled' | 'In Process' | 'Due' | 'Proposed';

export const PROJECT_STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: 'Requested', label: 'Requested' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'In Review', label: 'In Review' },
    { value: 'On Hold', label: 'On Hold' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
];

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
    { value: 'Paid', label: 'Paid' },
    { value: 'Unpaid', label: 'Unpaid' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Overdue', label: 'Overdue' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'In Process', label: 'In Process' },
    { value: 'Proposed', label: 'Proposed' },
];

export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  storage_path: string;
  created_at: string;
}

export interface Comment {
  id: string;
  text: string;
  timestamp: string;
  isTicket: boolean;
  author: User;
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
  created_at?: string;
  updated_at?: string;
  name: string;
  category?: string | null;
  description?: string | null;
  status: ProjectStatus;
  progress: number;
  budget: number;
  start_date: string;
  due_date: string;
  payment_status: PaymentStatus;
  created_by: User;
  origin_event_id?: string | null;
  payment_due_date?: string | null;
  slug: string;
  public?: boolean | null;
  venue?: string | null;
  kanban_order?: number | null;
  position?: number | null;
  payment_kanban_order?: number | null;
  invoice_number?: string | null;
  
  assignedTo: AssignedUser[];
  tags: Tag[];
  tasks: Task[];
  comments: Comment[];
  services: string[];
  briefFiles: ProjectFile[];
  activities: Activity[];
  people?: Person[];
  person_ids?: string[];
}

// Tasks
export type TaskPriority = 'Low' | 'Normal' | 'High' | 'Urgent';
export type TaskStatus = 'To do' | 'In Progress' | 'Done' | 'Cancelled';

export const TASK_PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
    { value: 'Low', label: 'Low' },
    { value: 'Normal', label: 'Normal' },
    { value: 'High', label: 'High' },
    { value: 'Urgent', label: 'Urgent' },
];

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
    { value: 'To do', label: 'To do' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Done', label: 'Done' },
    { value: 'Cancelled', label: 'Cancelled' },
];

export interface TaskAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
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
    status: TaskStatus;
    due_date: string | null;
    priority: TaskPriority | null;
    project_id: string;
    projects: {
        id: string;
        name: string;
        slug: string;
        status: string;
        created_by: string | null;
    } | null;
    assignees: TaskAssignee[];
    created_by: TaskAssignee | null;
    created_at: string;
    updated_at: string;
    tags: Tag[];
    originTicketId?: string;
    attachment_url?: string;
    attachment_name?: string;
    attachments?: TaskAttachment[];
}

// Chat
export interface Reaction {
  emoji: string;
  user_id: string;
  user_name: string;
}

export interface Attachment {
  url: string;
  name: string;
  type: string;
}

export interface RepliedMessageInfo {
  content: string;
  senderName: string;
  isDeleted: boolean;
}

export interface Message {
  id: string;
  text: string;
  timestamp: string;
  sender: User;
  attachment?: Attachment;
  reply_to_message_id?: string | null;
  repliedMessage?: RepliedMessageInfo | null;
  reactions?: Reaction[];
}

export interface Conversation {
  id: string;
  userName: string;
  userAvatar?: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  messages: Message[];
  isGroup: boolean;
  members: Collaborator[];
  created_by?: string;
}

// Goals
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

// People / CRM
export interface Person {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  job_title?: string | null;
  notes?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
  projects: { id: string; name: string; slug: string }[];
  tags: Tag[];
  contact?: { emails?: string[], phones?: string[] };
  address?: any;
  custom_properties?: Record<string, any>;
  company_id?: string;
  department?: string;
  social_media?: { [key: string]: string };
  birthday?: string;
  kanban_order?: number;
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
    user_id: string | null;
    custom_properties?: Record<string, any> | null;
}

export interface ContactProperty {
    id: string;
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'multi-select' | 'checkbox' | 'url' | 'email' | 'phone' | 'textarea' | 'image';
    is_default: boolean;
    created_at?: string;
    options?: { value: string; label: string }[];
}

export interface CompanyProperty {
    id: string;
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'date' | 'email' | 'phone' | 'url' | 'image' | 'select';
    options?: string[];
    is_default?: boolean;
}

// Knowledge Base
export type FolderAccessLevel = 'private' | 'public_view' | 'public_edit';

export interface KbFolderCollaborator {
  user: User;
  role: 'viewer' | 'editor';
}

export interface KbFolder {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  article_count?: number;
  slug: string;
  icon?: string;
  color?: string;
  category?: string;
  access_level?: FolderAccessLevel;
  collaborators?: KbFolderCollaborator[];
}

export interface KbArticle {
  id: string;
  title: string;
  slug: string;
  content: any;
  folder_id: string;
  updated_at: string;
  header_image_url?: string;
  kb_folders: {
    name: string;
    slug: string;
  };
  tags?: { id: string; name: string; color: string }[];
  creator?: { id: string; name: string; avatar_url?: string; initials: string };
}

// Notifications
export interface Notification {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  link?: string;
  actor: {
    id: string;
    name: string;
    avatar?: string;
  };
}