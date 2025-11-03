export const PROJECT_STATUS_OPTIONS = [
  { value: 'Requested', label: 'Requested' },
  { value: 'On Track', label: 'On Track' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Bid Lost', label: 'Bid Lost' },
] as const;

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'Proposed', label: 'Proposed' },
  { value: 'Invoiced', label: 'Invoiced' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Partially Paid', label: 'Partially Paid' },
  { value: 'Overdue', label: 'Overdue' },
] as const;

export const TASK_STATUS_OPTIONS = [
  { value: 'To do', label: 'To do' },
  { value: 'In progress', label: 'In progress' },
  { value: 'Done', label: 'Done' },
] as const;

export const TASK_PRIORITY_OPTIONS = [
  { value: 'Urgent', label: 'Urgent' },
  { value: 'High', label: 'High' },
  { value: 'Normal', label: 'Normal' },
  { value: 'Low', label: 'Low' },
] as const;

export type ProjectStatus = typeof PROJECT_STATUS_OPTIONS[number]['value'];
export type PaymentStatus = typeof PAYMENT_STATUS_OPTIONS[number]['value'];
export type TaskStatus = typeof TASK_STATUS_OPTIONS[number]['value'];
export type TaskPriority = typeof TASK_PRIORITY_OPTIONS[number]['value'];

export const CUSTOM_PROPERTY_TYPES = [
  "text",
  "textarea",
  "number",
  "date",
  "email",
  "phone",
  "url",
  "image",
  "multi-image",
  "select",
  "multi-select",
  "checkbox",
] as const;

export type CustomPropertyType = (typeof CUSTOM_PROPERTY_TYPES)[number];

export type CustomProperty = {
  id: string;
  name: string;
  label: string;
  type: CustomPropertyType;
  options?: string[] | null;
  category: 'company' | 'contact' | 'tag';
  is_default: boolean;
};

export type User = {
  id: string;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  role?: string | null;
};

export type Person = {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  company_id?: string | null;
  job_title?: string | null;
  avatar_url?: string | null;
  slug?: string;
  address?: any;
  contact?: { emails?: string[], phones?: string[] };
  department?: string | null;
  birthday?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  projects?: { id: string, name: string, slug: string, status: string }[];
  tags?: Tag[];
  user_id?: string | null;
  custom_properties?: Record<string, any> | null;
  social_media?: { [key: string]: string };
};

export type Company = {
  id: string;
  name: string;
  legal_name?: string | null;
  address?: string | null;
  logo_url?: string | null;
  custom_properties?: Record<string, any> | null;
};

export type Reaction = {
  id: string;
  emoji: string;
  user_id: string;
  user_name: string;
};

export type Comment = {
  id: string;
  created_at: string;
  text: string;
  is_ticket: boolean;
  author: User;
  author_id: string;
  project_id: string;
  task_id: string;
  reactions: Reaction[];
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachments_jsonb?: any[];
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

export type Tag = {
  id: string;
  name: string;
  color: string;
  user_id: string;
  type?: string;
  custom_properties?: Record<string, any> | null;
  isNew?: boolean;
};

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  due_date?: string | null;
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
  origin_ticket_id?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachments?: TaskAttachment[];
  ticket_attachments?: TaskAttachment[];
  reactions: Reaction[];
  last_reminder_sent_at?: string | null;
};

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  budget?: number | null;
  start_date?: string | null;
  due_date?: string | null;
  payment_status: PaymentStatus;
  payment_due_date?: string | null;
  venue?: string | null;
  services?: string[];
  people?: Person[];
  person_ids?: string[];
  client_company_id?: string | null;
  tasks?: Task[];
};

export type UpsertTaskPayload = {
  id?: string;
  project_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  completed?: boolean;
  assignee_ids?: string[];
  tag_ids?: string[];
  new_files?: File[];
  deleted_files?: string[];
};