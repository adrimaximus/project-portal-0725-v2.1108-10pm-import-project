export type User = {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  initials: string;
  role?: string;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
  isNew?: boolean;
  user_id?: string | null;
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
  payment_status: string;
  payment_due_date: string | null;
  created_by: User;
  assignedTo: User[];
  services: string[];
  tags: Tag[];
  personal_for_user_id?: string | null;
  client_name?: string | null;
  client_avatar_url?: string | null;
  client_company_name?: string | null;
  client_company_logo_url?: string | null;
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
  status: TaskStatus;
  tags: Tag[];
  attachments?: TaskAttachment[];
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