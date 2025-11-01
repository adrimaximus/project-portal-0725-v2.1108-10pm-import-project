import { Database } from './supabase';

export type Project = Database['public']['Functions']['get_dashboard_projects']['Returns'][0];
export type Task = Database['public']['Functions']['get_project_tasks']['Returns'][0];
export type Person = Database['public']['Tables']['people']['Row'];
export type Company = Database['public']['Tables']['companies']['Row'];
export type User = Database['public']['Tables']['profiles']['Row'] & { permissions?: string[] };
export type Reaction = Database['public']['Tables']['comment_reactions']['Row'] & { user_name?: string };

export const PROJECT_STATUSES = [
  "Requested",
  "On Hold",
  "Reschedule",
  "In Progress",
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
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Bid Lost", label: "Bid Lost" },
  { value: "Archived", label: "Archived" },
];

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'Unpaid', label: 'Unpaid' },
  { value: 'Partially Paid', label: 'Partially Paid' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Overdue', label: 'Overdue' },
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