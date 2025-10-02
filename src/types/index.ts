// General
export interface User {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  avatar_url?: string;
  initials?: string;
  role?: string;
  people_kanban_settings?: any;
  status?: string;
  updated_at?: string;
}

export type AssignedUser = User;
export type Collaborator = User;

export interface Tag {
  id: string;
  name: string;
  color: string;
  isNew?: boolean;
  user_id?: string;
}

// Projects
export type ProjectStatus = 'On Track' | 'At Risk' | 'Off Track' | 'On Hold' | 'Completed' | 'Archived' | 'In Progress';
export type PaymentStatus = 'Paid' | 'Pending' | 'In Process' | 'Overdue' | 'Proposed' | 'Cancelled' | 'Unpaid';

export const PROJECT_STATUS_OPTIONS = [
  { value: 'On Track', label: 'On Track' },
  { value: 'At Risk', label: 'At Risk' },
  { value: 'Off Track', label: 'Off Track' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Archived', label: 'Archived' },
  { value: 'In Progress', label: 'In Progress' },
];

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'Paid', label: 'Paid' },
  { value: 'Pending', label: 'Pending' },
  { value: 'In Process', label: 'In Process' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'Proposed', label: 'Proposed' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Unpaid', label: 'Unpaid' },
];

export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  status: ProjectStatus;
  progress?: number;
  budget?: number;
  start_date?: string;
  due_date?: string;
  payment_status: PaymentStatus;
  payment_due_date?: string;
  venue?: string;
  created_by: AssignedUser;
  assignedTo: AssignedUser[];
  services?: string[];
  tags?: Tag[];
  tasks?: Task[];
  comments?: Comment[];
  briefFiles?: ProjectFile[];
  activities?: Activity[];
}

// Tasks
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TaskStatus = 'To do' | 'In progress' | 'Done';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  due_date?: string;
  priority: TaskPriority;
  status: TaskStatus;
  project_id: string;
  assignees?: AssignedUser[];
  assignedTo?: AssignedUser[]; // Legacy, keeping for compatibility
  originTicketId?: string;
  created_by: User;
}

// Comments & Activity
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

export interface ProjectFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  storage_path: string;
}

// Chat
export interface Attachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender: User;
  created_at: string;
  timestamp?: string; // for AI chat
  attachment?: Attachment;
  reply_to?: Message;
  conversation_id: string;
  reply_to_message_id?: string; // from DB
  is_deleted?: boolean; // from DB

  // from get_conversation_messages
  replied_message_content?: string;
  replied_message_sender_name?: string;
  replied_message_is_deleted?: boolean;

  // client-side additions
  text?: string; // alias for content
  repliedMessage?: { content: string; senderName: string; isDeleted: boolean };
}

export interface Conversation {
  id: string;
  name?: string;
  avatar?: string;
  participants: User[];
  is_group: boolean;
  created_by: string;
  last_message_content?: string;
  last_message_at?: string;
  messages?: Message[];
}

// Notifications
export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
  actor: User;
  resource_type: string;
  resource_id: string;
  data: { link: string };
}

// Goals
export type GoalType = string;
export type GoalPeriod = string;

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
  icon_url?: string;
  color: string;
  type: GoalType;
  target_quantity?: number;
  target_value?: number;
  frequency?: GoalPeriod;
  target_period?: GoalPeriod;
  unit?: string;
  specific_days?: string[];
  completions: GoalCompletion[];
  collaborators: User[];
  tags: Tag[];
  slug: string;
}

// People / Contacts
export type ContactPropertyType = 'text' | 'email' | 'phone' | 'url' | 'date' | 'textarea' | 'number' | 'image' | 'select';

export interface ContactProperty {
  id: string;
  name: string;
  label: string;
  type: ContactPropertyType;
  options?: string[];
  is_default: boolean;
}

export interface Person {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  avatar_url?: string;
  projects?: { id: string; name: string; slug: string }[];
  tags?: Tag[];
  contact?: any;
  social_media?: any;
  birthday?: string;
  notes?: string;
  address?: any;
  custom_properties?: { [key: string]: any };
  department?: string;
  updated_at?: string;
  kanban_order?: number;
}

// Companies
export interface Company {
  id: string;
  name: string;
  legal_name?: string;
  address?: string;
  billing_address?: string;
  logo_url?: string;
}

// Knowledge Base
export type FolderAccessLevel = 'private' | 'public_view' | 'public_edit';

export interface KbFolder {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  access_level: FolderAccessLevel;
  collaborators?: User[];
  user_id: string;
  slug: string;
  category?: string;
  updated_at?: string;
}

export interface KbArticle {
  id: string;
  title: string;
  slug: string;
  content: any; // JSONB
  folder_id: string;
  header_image_url?: string;
  tags?: Tag[];
  creator?: User;
  updated_at: string;
  kb_folders?: { name: string; slug: string; };
}