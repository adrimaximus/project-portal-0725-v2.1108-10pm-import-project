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
export type ProjectStatus = 'On Track' | 'At Risk' | 'Off Track' | 'On Hold' | 'Completed' | 'Archived' | 'Idea' | 'In Progress' | 'Done';
export type PaymentStatus = 'Paid' | 'Unpaid' | 'Pending' | 'Overdue' | 'Cancelled' | 'In Process' | 'Due';

export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
    { value: 'On Track', label: 'On Track' },
    { value: 'At Risk', label: 'At Risk' },
    { value: 'Off Track', label: 'Off Track' },
    { value: 'On Hold', label: 'On Hold' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Archived', label: 'Archived' },
    { value: 'Idea', label: 'Idea' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Done', label: 'Done' },
];

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
    { value: 'Paid', label: 'Paid' },
    { value: 'Unpaid', label: 'Unpaid' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Overdue', label: 'Overdue' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'In Process', label: 'In Process' },
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
  status?: ProjectStatus | string | null;
  progress?: number | null;
  budget?: number | null;
  start_date?: string | null;
  due_date?: string | null;
  payment_status?: PaymentStatus | null;
  created_by: User | string;
  origin_event_id?: string | null;
  payment_due_date?: string | null;
  slug: string;
  public?: boolean | null;
  venue?: string | null;
  kanban_order?: number | null;
  position?: number | null;
  payment_kanban_order?: number | null;
  invoice_number?: string | null;
  
  // Joined properties from RPC calls
  assignedTo?: AssignedUser[];
  tags?: Tag[];
  tasks?: Task[];
  comments?: Comment[];
  services?: string[];
  briefFiles?: ProjectFile[];
  activities?: Activity[];
  people?: Person[];
  person_ids?: string[];
}

// Tasks
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TaskStatus = 'To do' | 'In progress' | 'Done' | 'Backlog';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  due_date?: string;
  priority: TaskPriority;
  project_id: string;
  project_name?: string;
  project_slug?: string;
  assignees: AssignedUser[];
  createdBy: User;
  created_at: string;
  status: TaskStatus;
  tags: Tag[];
  originTicketId?: string;
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

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  attachment?: Attachment;
  reactions: Reaction[];
  reply_to_message_id?: string;
  is_deleted?: boolean;
  sender: User;
  replied_message_content?: string;
  replied_message_sender_name?: string;
}

export interface Conversation {
  id: string;
  is_group: boolean;
  name: string;
  avatar_url: string | null;
  participants: Collaborator[];
  last_message_content: string | null;
  last_message_at: string | null;
  other_user_id?: string;
  created_by?: string;
}

// Goals
export type GoalType = 'habit' | 'target' | 'limit';
export type GoalPeriod = 'daily' | 'weekly' | 'monthly';

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
  description?: string;
  icon: string;
  color: string;
  type: GoalType;
  target_quantity?: number;
  target_value?: number;
  frequency?: GoalPeriod;
  unit?: string;
  completions: GoalCompletion[];
  tags: Tag[];
  collaborators: Collaborator[];
  slug: string;
  specific_days?: string[];
  target_period?: string;
  icon_url?: string;
  created_at: string;
  updated_at: string;
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
    custom_properties?: Record<string, any> | null;
}

export interface ContactProperty {
    id: string;
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'multi-select' | 'checkbox' | 'url' | 'email' | 'phone' | 'textarea' | 'image';
    is_default?: boolean;
    options?: { value: string; label: string }[];
}

export interface CompanyProperty {
    id: string;
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'image' | 'url';
    is_default?: boolean;
    options?: { value: string; label: string }[];
}

// Knowledge Base
export type FolderAccessLevel = 'private' | 'public_view' | 'public_edit';

export interface KbFolder {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  access_level: FolderAccessLevel;
  slug: string;
  last_modified_by?: User;
  articles?: KbArticle[];
  collaborators?: User[];
  category?: string;
  updated_at: string;
}

export interface KbArticle {
  id: string;
  title: string;
  slug: string;
  content: any; // JSONB
  folder_id: string;
  updated_at: string;
  header_image_url?: string;
  kb_folders?: { name: string; slug: string };
  tags: Tag[];
  creator: User;
}

// Notifications
export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  created_at: string;
  resource_type: string;
  resource_id: string;
  data: { link?: string };
  actor: User;
  read_at: string | null;
}