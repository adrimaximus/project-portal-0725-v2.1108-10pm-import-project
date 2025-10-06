import { Tag } from './goal';

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

export type TaskStatus = 'To do' | 'In Progress' | 'Done' | 'Cancelled';

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'To do', label: 'To do' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Done', label: 'Done' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export type TaskPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export const TASK_PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
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