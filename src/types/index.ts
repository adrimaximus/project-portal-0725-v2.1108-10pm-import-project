import { RealtimeChannel } from '@supabase/supabase-js';

export interface User {
  id: string;
  name?: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string;
  avatar_url?: string | null;
  role?: string;
  initials?: string;
}

export interface Profile extends User {
  status?: string;
  sidebar_order?: any;
  notification_preferences?: any;
  permissions?: string[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id: string | null;
}

export const CUSTOM_PROPERTY_TYPES = [
  'text',
  'textarea',
  'number',
  'date',
  'email',
  'phone',
  'url',
  'image',
  'multi-image',
  'select',
  'multi-select',
  'checkbox',
] as const;

export interface CustomProperty {
  id: string;
  name: string;
  label: string;
  type: (typeof CUSTOM_PROPERTY_TYPES)[number];
  options?: string[] | null;
  is_default: boolean;
  category: 'contact' | 'company' | 'tag';
}

export interface Reaction {
  id: string;
  emoji: string;
  user_id: string;
  user_name: string;
}

export interface Comment {
  id: string;
  text: string | null;
  created_at: string;
  author: User;
  reactions: Reaction[];
  is_ticket: boolean;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachments_jsonb?: TaskAttachment[] | null;
  project_id: string;
  task_id: string | null;
  reply_to_message_id?: string | null;
  repliedMessage?: {
    content: string;
    senderName: string;
    isDeleted: boolean;
  } | null;
}

export type TaskStatus = 'To do' | 'In progress' | 'In review' | 'Done';

export const TASK_STATUS_OPTIONS: { value: TaskStatus, label: string }[] = [
  { value: 'To do', label: 'To Do' },
  { value: 'In progress', label: 'In Progress' },
  { value: 'In review', label: 'In Review' },
  { value: 'Done', label: 'Done' },
];

export type TaskPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export const TASK_PRIORITY_OPTIONS: { value: TaskPriority, label: string }[] = [
  { value: 'Low', label: 'Low' },
  { value: 'Normal', label: 'Normal' },
  { value: 'High', label: 'High' },
  { value: 'Urgent', label: 'Urgent' },
];

export interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  due_date: string | null;
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
  origin_ticket_id: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachments?: TaskAttachment[];
  project_venue?: string | null;
  project_owner: User | null;
  project_client?: string | null;
  reactions: Reaction[];
  kanban_order: number;
  ticket_attachments?: TaskAttachment[];
  last_reminder_sent_at?: string | null;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  status: ProjectStatus;
  progress: number;
  budget: number | null;
  start_date: string | null;
  due_date: string | null;
  payment_status: PaymentStatus;
  payment_due_date: string | null;
  created_by: User;
  assignedTo: User[];
  tasks: Task[];
  comments: Comment[];
  services: string[];
  briefFiles: any[];
  activities: any[];
  tags: Tag[];
  client_name: string | null;
  client_avatar_url: string | null;
  client_company_logo_url: string | null;
  client_company_name: string | null;
  client_company_custom_properties: any | null;
  client_company_id: string | null;
  reactions: Reaction[];
  public: boolean;
}

export type ProjectStatus = 'On Track' | 'At Risk' | 'Off Track' | 'On Hold' | 'Completed' | 'Archived' | 'Cancelled' | 'Bid Lost' | 'Billing Process' | 'In Progress' | 'Pending' | 'Requested' | 'Planning' | 'Reschedule';

export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus, label: string }[] = [
    { value: 'On Track', label: 'On Track' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Requested', label: 'Requested' },
    { value: 'Planning', label: 'Planning' },
    { value: 'At Risk', label: 'At Risk' },
    { value: 'Off Track', label: 'Off Track' },
    { value: 'On Hold', label: 'On Hold' },
    { value: 'Reschedule', label: 'Reschedule' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Billing Process', label: 'Billing Process' },
    { value: 'Archived', label: 'Archived' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'Bid Lost', label: 'Bid Lost' },
];

export type PaymentStatus = 'Paid' | 'Overdue' | 'Partially Paid' | 'Unpaid' | 'Pending' | 'In Process' | 'Requested' | 'Invoiced' | 'Quo Approved' | 'Inv Approved' | 'Proposed' | 'Cancelled' | 'Bid Lost';

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus, label: string }[] = [
    { value: 'Paid', label: 'Paid' },
    { value: 'Overdue', label: 'Overdue' },
    { value: 'Partially Paid', label: 'Partially Paid' },
    { value: 'Unpaid', label: 'Unpaid' },
    { value: 'Pending', label: 'Pending' },
    { value: 'In Process', label: 'In Process' },
    { value: 'Requested', label: 'Requested' },
    { value: 'Invoiced', label: 'Invoiced' },
    { value: 'Quo Approved', label: 'Quotation Approved' },
    { value: 'Inv Approved', label: 'Invoice Approved' },
    { value: 'Proposed', label: 'Proposed' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'Bid Lost', label: 'Bid Lost' },
];

export interface TaskAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  created_at: string;
}

export interface UpsertTaskPayload {
  id?: string | null;
  project_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  completed?: boolean;
  assignee_ids?: string[];
  tag_ids?: string[];
  origin_ticket_id?: string | null;
  new_files?: File[];
  deleted_files?: string[];
}