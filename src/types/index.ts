import { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  initials?: string;
  role?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id?: string;
}

export interface Reaction {
  id: string;
  emoji: string;
  user_id: string;
  user_name: string;
}

export interface TaskAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  created_at: string;
}

export type TaskStatus = 'To do' | 'In progress' | 'In review' | 'Done';
export type TaskPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

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
  attachments: TaskAttachment[];
  project_venue: string | null;
  project_owner: User;
  project_client: string | null;
  reactions: Reaction[];
  kanban_order: number;
  ticket_attachments?: TaskAttachment[];
  last_reminder_sent_at?: string | null;
}

export type ProjectStatus = 'On Track' | 'At Risk' | 'Off Track' | 'On Hold' | 'Completed' | 'Archived' | 'New' | 'In Progress' | 'Pending' | 'Cancelled' | 'Bid Lost';

export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'On Track', label: 'On Track' },
  { value: 'At Risk', label: 'At Risk' },
  { value: 'Off Track', label: 'Off Track' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Archived', label: 'Archived' },
  { value: 'New', label: 'New' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Bid Lost', label: 'Bid Lost' },
];

export type PaymentStatus = 'Paid' | 'Overdue' | 'Due' | 'Unpaid' | 'Pending' | 'In Process' | 'Proposed' | 'Cancelled' | 'Bid Lost';

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
    { value: 'Paid', label: 'Paid' },
    { value: 'Overdue', label: 'Overdue' },
    { value: 'Due', label: 'Due' },
    { value: 'Unpaid', label: 'Unpaid' },
    { value: 'Pending', label: 'Pending' },
    { value: 'In Process', label: 'In Process' },
    { value: 'Proposed', label: 'Proposed' },
    { value: 'Cancelled', label: 'Cancelled' },
];

export interface UpsertTaskPayload {
  id?: string;
  project_id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  completed?: boolean;
  assignee_ids?: string[];
  tag_ids?: string[];
  new_files?: File[];
  deleted_files?: string[];
}

export interface Profile extends User {
  role: string;
  status: string;
  permissions: string[];
}

export interface AppUser extends SupabaseUser {
  profile: Profile;
}