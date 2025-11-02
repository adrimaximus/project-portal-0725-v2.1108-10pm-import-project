import { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  href?: string;
  disabled?: boolean;
  external?: boolean;
  icon?: LucideIcon;
  label?: string;
}

export interface NavItemWithChildren extends NavItem {
  items?: NavItemWithChildren[];
}

export const PROJECT_STATUS_OPTIONS = [
  { value: 'On Track', label: 'On Track', color: 'bg-green-500' },
  { value: 'At Risk', label: 'At Risk', color: 'bg-yellow-500' },
  { value: 'Off Track', label: 'Off Track', color: 'bg-red-500' },
  { value: 'Pending', label: 'Pending', color: 'bg-gray-500' },
  { value: 'Completed', label: 'Completed', color: 'bg-blue-500' },
  { value: 'Cancelled', label: 'Cancelled', color: 'bg-zinc-500' },
  { value: 'Bid Lost', label: 'Bid Lost', color: 'bg-orange-500' },
] as const;

export const PAYMENT_STATUS_OPTIONS = [
    { value: 'Paid', label: 'Paid' },
    { value: 'Unpaid', label: 'Unpaid' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Overdue', label: 'Overdue' },
    { value: 'In Process', label: 'In Process' },
    { value: 'Proposed', label: 'Proposed' },
] as const;

export type ProjectStatus = typeof PROJECT_STATUS_OPTIONS[number]['value'];
export type PaymentStatus = typeof PAYMENT_STATUS_OPTIONS[number]['value'];

export type TaskPriority = 'Low' | 'Normal' | 'High' | 'Urgent';
export const TASK_PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'Low', label: 'Low' },
  { value: 'Normal', label: 'Normal' },
  { value: 'High', label: 'High' },
  { value: 'Urgent', label: 'Urgent' },
];

export type TaskStatus = 'To do' | 'In progress' | 'Done' | 'Backlog';
export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'To do', label: 'To do' },
  { value: 'In progress', label: 'In progress' },
  { value: 'Done', label: 'Done' },
  { value: 'Backlog', label: 'Backlog' },
];

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  initials: string;
  role?: string;
}

export interface Person {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  notes?: string;
  avatar_url?: string;
  projects?: { id: string; name: string; slug: string }[];
  tags?: Tag[];
  user_id?: string;
  company_id?: string;
  slug: string;
}

export interface Company {
  id: string;
  name: string;
  legal_name?: string;
  address?: string;
  billing_address?: string;
  logo_url?: string;
  custom_properties?: Record<string, any>;
}

export interface Project {
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
  created_by: User;
  assignedTo: User[];
  tasks: Task[];
  comments: Comment[];
  services: string[];
  briefFiles: any[];
  activities: any[];
  tags: Tag[];
  people?: Person[];
  person_ids?: string[];
  client_company_id?: string;
  public: boolean;
  venue?: string;
  personal_for_user_id?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  originTicketId?: string;
  assignedTo: User[];
  project_id: string;
  project_slug: string;
  project_name: string;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  description?: string;
  tags: Tag[];
  created_by: User;
  attachments?: TaskAttachment[];
  ticket_attachments?: TaskAttachment[];
}

export interface TaskAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
}

export interface UpsertTaskPayload {
  id?: string;
  project_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority?: TaskPriority | null;
  status?: TaskStatus;
  completed: boolean;
  assignee_ids?: string[];
  tag_ids?: string[];
  new_files?: File[];
  deleted_files?: string[];
}

export interface Comment {
  id: string;
  text: string;
  created_at: string;
  isTicket: boolean;
  author: User;
  attachment_url?: string;
  attachment_name?: string;
  attachments_jsonb?: TaskAttachment[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  isNew?: boolean;
  user_id?: string;
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

export type CustomPropertyType = (typeof CUSTOM_PROPERTY_TYPES)[number];

export interface CustomProperty {
  id: string;
  name: string;
  label: string;
  type: CustomPropertyType;
  options?: string[] | null;
  category: 'contact' | 'company' | 'tag';
  is_default: boolean;
}