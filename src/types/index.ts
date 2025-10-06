// User & Auth
export type UserProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  name: string; // often a computed full name
  email: string;
  avatar_url: string | null;
  initials: string;
  role?: string;
};

// This seems to be used interchangeably with UserProfile. Let's make it an alias.
export type User = UserProfile;
export type Collaborator = UserProfile;
export type AssignedUser = UserProfile;

// Projects
export type ProjectStatus = 'On Track' | 'At Risk' | 'Off Track' | 'On Hold' | 'Completed';
export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'On Track', label: 'On Track' },
  { value: 'At Risk', label: 'At Risk' },
  { value: 'Off Track', label: 'Off Track' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Completed', label: 'Completed' },
];

export type PaymentStatus = 'Paid' | 'Unpaid' | 'Overdue' | 'Partially Paid';
export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'Paid', label: 'Paid' },
  { value: 'Unpaid', label: 'Unpaid' },
  { value: 'Overdue', label: 'Overdue' },
  { value: 'Partially Paid', label: 'Partially Paid' },
];

export type Tag = {
  id: string;
  name: string;
  color: string;
  isNew?: boolean; // For client-side logic
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

export type Project = {
  id: string;
  created_at?: string;
  updated_at?: string;
  name: string;
  category?: string;
  description?: string;
  status?: ProjectStatus;
  progress?: number;
  budget?: number;
  start_date?: string;
  due_date?: string;
  payment_status: PaymentStatus;
  created_by: UserProfile | string; // Can be populated or just an ID
  origin_event_id?: string;
  payment_due_date?: string;
  slug: string;
  public?: boolean;
  venue?: string;
  kanban_order?: number;
  position?: number;
  payment_kanban_order?: number;
  invoice_number?: string;
  assignedTo?: UserProfile[];
  services?: string[];
  tags?: Tag[];
  tasks?: Task[];
  comments?: Comment[];
  briefFiles?: ProjectFile[];
  activities?: Activity[];
  person_ids?: string[]; // For forms
};

// Tasks
export type TaskStatus = 'To do' | 'In progress' | 'Done';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export type Task = {
  id: string;
  title: string;
  completed: boolean;
  project_id: string;
  created_by: UserProfile;
  assignedTo?: UserProfile[];
  originTicketId?: string;
  due_date?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
};

// Comments & Activity
export type Comment = {
  id: string;
  text: string;
  timestamp: string;
  isTicket: boolean;
  author: UserProfile;
  attachment_url?: string;
  attachment_name?: string;
};

export type Activity = {
  id: string;
  type: string;
  details: { description: string };
  timestamp: string;
  user: UserProfile;
};

// People & Companies
export type Person = {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  notes?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  projects?: { id: string; name: string; slug: string }[];
  tags?: Tag[];
  contact?: { emails?: string[], phones?: string[] };
  social_media?: Record<string, string>;
  birthday?: string;
  address?: any;
  custom_properties?: Record<string, any>;
};

export type Company = {
  id: string;
  name: string;
  legal_name?: string;
  address?: string;
  billing_address?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  custom_properties?: Record<string, any>;
};

export type ContactProperty = {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'email' | 'phone' | 'url' | 'textarea' | 'select';
  is_default?: boolean;
  options?: string[];
};

export type CompanyProperty = {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'email' | 'phone' | 'url' | 'textarea' | 'select' | 'image';
  options?: any;
  is_default?: boolean;
  created_at?: string;
};

// Goals
export type GoalType = 'habit' | 'target';
export type GoalPeriod = 'day' | 'week' | 'month' | 'year';

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
  description?: string;
  icon: string;
  icon_url?: string;
  color: string;
  type: GoalType;
  target_quantity?: number;
  target_value?: number;
  frequency?: string;
  target_period?: GoalPeriod;
  unit?: string;
  specific_days?: string[];
  created_at: string;
  updated_at: string;
  slug: string;
  tags?: Tag[];
  collaborators?: UserProfile[];
  completions?: GoalCompletion[];
};

// Knowledge Base
export type FolderAccessLevel = 'private' | 'public_view' | 'public_edit';

export type KbFolder = {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  slug: string;
  icon: string;
  color: string;
  category?: string;
  access_level: FolderAccessLevel;
  collaborators?: UserProfile[];
};

export type KbArticle = {
  id: string;
  folder_id: string;
  user_id: string;
  title: string;
  content: any; // JSON from editor
  slug: string;
  created_at: string;
  updated_at: string;
  header_image_url?: string;
  tags?: Tag[];
  creator?: UserProfile;
  kb_folders?: { name: string, slug: string };
};

// Chat
export type Attachment = {
  name: string;
  type: string;
  url: string;
  size?: number;
};

export type Reaction = {
  emoji: string;
  user_id: string;
  user_name: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  created_at: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  message_type: 'user' | 'system_notification';
  reply_to_message_id?: string | null;
  is_deleted?: boolean;
  is_forwarded?: boolean;
  sender_first_name?: string | null;
  sender_last_name?: string | null;
  sender_avatar_url?: string | null;
  sender_email?: string | null;
  replied_message_content?: string | null;
  replied_message_sender_name?: string | null;
  replied_message_is_deleted?: boolean;
  reactions?: Reaction[];
  // Client-side properties
  sender?: UserProfile;
  attachment?: Attachment;
  reply_to?: Message;
};

export type Conversation = {
  conversation_id: string;
  is_group: boolean;
  conversation_name: string;
  conversation_avatar: string | null;
  last_message_content: string | null;
  last_message_at: string | null;
  other_user_id: string | null;
  participants: UserProfile[];
  created_by: string;
};

// Notifications
export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  created_at: string;
  resource_type: string;
  resource_id: string;
  data: { link: string };
  actor: UserProfile;
  read_at: string | null;
};